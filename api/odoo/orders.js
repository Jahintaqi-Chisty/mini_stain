const REQUIRED_ENV = ["ODOO_BASE_URL", "ODOO_DB", "ODOO_USER", "ODOO_API_KEY"];

async function jsonRpcCall(baseUrl, service, method, args) {
  const res = await fetch(`${baseUrl}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: { service, method, args },
      id: Date.now(),
    }),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = payload?.error?.data?.message || payload?.error?.message || res.statusText;
    throw new Error(`Odoo HTTP ${res.status}: ${msg}`);
  }
  if (payload.error) {
    const msg = payload.error?.data?.message || payload.error?.message || "Odoo error";
    throw new Error(msg);
  }
  return payload.result;
}

async function odooLogin(baseUrl, db, user, apiKey) {
  const uid = await jsonRpcCall(baseUrl, "common", "login", [db, user, apiKey]);
  if (!uid) throw new Error("Odoo login failed");
  return uid;
}

async function executeKw(baseUrl, db, uid, apiKey, model, method, args, kwargs = {}) {
  return jsonRpcCall(baseUrl, "object", "execute_kw", [db, uid, apiKey, model, method, args, kwargs]);
}

function mapStatus(state) {
  const s = String(state || "");
  if (s === "cancel") return "Cancelled";
  if (s === "done") return "Delivered";
  if (s === "sale") return "Processing";
  if (s === "sent" || s === "draft") return "Pending";
  return "Pending";
}

function splitName(name) {
  const parts = String(name || "").trim().split(/\s+/);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function toIso(dateStr) {
  if (!dateStr) return new Date().toISOString();
  const clean = String(dateStr).trim().replace(" ", "T");
  const d = new Date(clean.endsWith("Z") ? clean : `${clean}Z`);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function parseLine(line) {
  const qty = Number(line.product_uom_qty || 0) || 1;
  const price = Number(line.price_unit || 0) || 0;
  const rawName = line.name || (Array.isArray(line.product_id) ? line.product_id[1] : "Item");
  let name = rawName;
  let variant = "";
  let size = "";
  if (rawName.includes(" · ")) {
    const parts = rawName.split(" · ").map((p) => p.trim()).filter(Boolean);
    name = parts.shift() || rawName;
    parts.forEach((p) => {
      if (/size/i.test(p)) size = p.replace(/size\s*/i, "").trim();
      else if (!variant) variant = p;
    });
  }
  return {
    cartId: `odoo-${line.id}`,
    id: Array.isArray(line.product_id) ? line.product_id[0] : line.product_id || line.id,
    name,
    variant: variant || "Default",
    size,
    qty,
    price,
    image: "",
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    res.status(500).json({ error: `Missing env: ${missing.join(", ")}` });
    return;
  }

  const baseUrl = String(process.env.ODOO_BASE_URL || "").replace(/\/+$/, "");
  const db = process.env.ODOO_DB;
  const user = process.env.ODOO_USER;
  const apiKey = process.env.ODOO_API_KEY;

  try {
    const uid = await odooLogin(baseUrl, db, user, apiKey);

    const orderFields = [
      "id",
      "name",
      "origin",
      "date_order",
      "state",
      "amount_total",
      "amount_untaxed",
      "partner_id",
      "partner_shipping_id",
      "note",
      "order_line",
    ];
    const orderFieldsInfo = await executeKw(
      baseUrl,
      db,
      uid,
      apiKey,
      "sale.order",
      "fields_get",
      [orderFields],
      { attributes: ["type"] }
    );
    const fields = orderFields.filter((f) => orderFieldsInfo && orderFieldsInfo[f]);
    const orders = await executeKw(
      baseUrl,
      db,
      uid,
      apiKey,
      "sale.order",
      "search_read",
      [[]],
      { fields, order: "date_order desc", limit: 200 }
    );
    const list = Array.isArray(orders) ? orders : [];

    const lineIds = new Set();
    const partnerIds = new Set();
    list.forEach((o) => {
      (Array.isArray(o.order_line) ? o.order_line : []).forEach((id) => lineIds.add(id));
      const pid = Array.isArray(o.partner_id) ? o.partner_id[0] : o.partner_id;
      if (pid) partnerIds.add(pid);
    });

    const lineFields = [
      "id",
      "order_id",
      "product_id",
      "name",
      "product_uom_qty",
      "price_unit",
      "price_subtotal",
      "display_type",
    ];
    const lines = lineIds.size
      ? await executeKw(
          baseUrl,
          db,
          uid,
          apiKey,
          "sale.order.line",
          "search_read",
          [[[ "id", "in", Array.from(lineIds) ]]],
          { fields: lineFields }
        )
      : [];
    const linesByOrder = new Map();
    (Array.isArray(lines) ? lines : []).forEach((l) => {
      const oid = Array.isArray(l.order_id) ? l.order_id[0] : l.order_id;
      if (!oid) return;
      if (!linesByOrder.has(oid)) linesByOrder.set(oid, []);
      linesByOrder.get(oid).push(l);
    });

    const partnerFields = ["id", "name", "phone", "email", "street", "street2", "city", "state_id", "zip"];
    const partners = partnerIds.size
      ? await executeKw(
          baseUrl,
          db,
          uid,
          apiKey,
          "res.partner",
          "search_read",
          [[[ "id", "in", Array.from(partnerIds) ]]],
          { fields: partnerFields }
        )
      : [];
    const partnerMap = new Map((Array.isArray(partners) ? partners : []).map((p) => [p.id, p]));

    const mapped = list.map((o) => {
      const oid = o.id;
      const partnerId = Array.isArray(o.partner_id) ? o.partner_id[0] : o.partner_id;
      const partner = partnerMap.get(partnerId) || {};
      const nameObj = splitName(partner.name);
      const addrStreet = [partner.street, partner.street2].filter(Boolean).join(", ");
      const district = partner.city || (Array.isArray(partner.state_id) ? partner.state_id[1] : "");

      const oLines = (linesByOrder.get(oid) || []).filter((l) => !l.display_type);
      let shipping = 0;
      let discount = 0;
      const items = [];
      oLines.forEach((l) => {
        const subtotal = typeof l.price_subtotal === "number" ? l.price_subtotal : l.price_unit * (l.product_uom_qty || 1);
        const lname = String(l.name || "").toLowerCase();
        if (subtotal < 0) discount += Math.abs(subtotal);
        if (lname.includes("shipping") || lname.includes("delivery")) {
          if (subtotal > 0) shipping += subtotal;
          return;
        }
        items.push(parseLine(l));
      });

      return {
        orderId: o.name || o.origin || `SO-${oid}`,
        odooOrderId: oid,
        date: toIso(o.date_order),
        status: mapStatus(o.state),
        total: Number(o.amount_total || 0),
        shipping: Number(shipping || 0),
        discount: Number(discount || 0),
        items,
        address: {
          firstName: nameObj.firstName,
          lastName: nameObj.lastName,
          phone: partner.phone || "",
          email: partner.email || "",
          address: addrStreet || "",
          city: partner.city || "",
          district: district || "",
          notes: "",
        },
        payment: { method: "cod", trx: null },
        coupon: null,
        syncedAt: toIso(o.date_order),
        localOnly: false,
      };
    });

    res.status(200).json(mapped);
  } catch (err) {
    res.status(500).json({ error: err?.message || "Odoo orders fetch failed" });
  }
}
