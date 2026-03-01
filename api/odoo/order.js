const REQUIRED_ENV = ["ODOO_BASE_URL", "ODOO_DB", "ODOO_USER", "ODOO_API_KEY"];

async function readJson(req) {
  if (req.body) {
    if (typeof req.body === "string") return JSON.parse(req.body);
    return req.body;
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return null;
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : null;
}

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

function orderLineName(item) {
  const parts = [item.name];
  const variant = String(item.variant || "");
  const size = String(item.size || "");
  if (variant && variant.toLowerCase() !== "default") parts.push(variant);
  if (size) {
    const v = variant.toLowerCase();
    const s = size.toLowerCase();
    if (!v.includes(s) && !v.includes("size")) parts.push(`Size ${size}`);
  }
  return parts.filter(Boolean).join(" · ");
}

async function getOrCreateProductId(baseUrl, db, uid, apiKey, name, listPrice) {
  const found = await executeKw(
    baseUrl,
    db,
    uid,
    apiKey,
    "product.product",
    "search_read",
    [[["name", "=", name]]],
    { fields: ["id"], limit: 1 }
  );
  if (Array.isArray(found) && found[0]?.id) return found[0].id;

  const tmplId = await executeKw(
    baseUrl,
    db,
    uid,
    apiKey,
    "product.template",
    "create",
    [{ name, list_price: Number(listPrice || 0) }]
  );
  const tmpl = await executeKw(
    baseUrl,
    db,
    uid,
    apiKey,
    "product.template",
    "read",
    [[tmplId]],
    { fields: ["product_variant_id"] }
  );
  const variant = tmpl?.[0]?.product_variant_id;
  const productId = Array.isArray(variant) ? variant[0] : variant;
  if (productId) return productId;

  const retry = await executeKw(
    baseUrl,
    db,
    uid,
    apiKey,
    "product.product",
    "search_read",
    [[["name", "=", name]]],
    { fields: ["id"], limit: 1 }
  );
  if (Array.isArray(retry) && retry[0]?.id) return retry[0].id;
  throw new Error(`Failed to create product: ${name}`);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    res.status(500).json({ error: `Missing env: ${missing.join(", ")}` });
    return;
  }

  let payload;
  try {
    payload = await readJson(req);
  } catch {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  const order = payload?.order ?? payload;
  if (!order || !Array.isArray(order.items) || !order.address) {
    res.status(400).json({ error: "Invalid order payload" });
    return;
  }

  const baseUrl = String(process.env.ODOO_BASE_URL || "").replace(/\/+$/, "");
  const db = process.env.ODOO_DB;
  const user = process.env.ODOO_USER;
  const apiKey = process.env.ODOO_API_KEY;

  try {
    const uid = await odooLogin(baseUrl, db, user, apiKey);

    const firstName = order.address.firstName || "";
    const lastName = order.address.lastName || "";
    const name = `${firstName} ${lastName}`.trim() || order.address.phone || "MiniStain Customer";
    const phone = order.address.phone || null;
    const email = order.address.email || null;
    const street = order.address.address || null;
    const city = order.address.city || null;
    const street2 = order.address.district || null;

    const partnerDomain = phone
      ? [["phone", "=", phone]]
      : email
        ? [["email", "=", email]]
        : [["name", "=", name]];
    const partners = await executeKw(
      baseUrl,
      db,
      uid,
      apiKey,
      "res.partner",
      "search_read",
      [partnerDomain],
      { fields: ["id"], limit: 1 }
    );
    let partnerId = partners?.[0]?.id || null;
    if (!partnerId) {
      partnerId = await executeKw(
        baseUrl,
        db,
        uid,
        apiKey,
        "res.partner",
        "create",
        [{ name, phone, email, street, street2, city }]
      );
    }

    const lines = [];
    for (const item of order.items) {
      const lineName = orderLineName(item);
      const pid = Number(item.odooProductId);
      const productId = Number.isFinite(pid) && pid > 0
        ? pid
        : await getOrCreateProductId(baseUrl, db, uid, apiKey, lineName, item.price);
      lines.push([
        0,
        0,
        {
          product_id: productId,
          name: lineName,
          product_uom_qty: Number(item.qty || 1),
          price_unit: Number(item.price || 0),
        },
      ]);
    }

    if (Number(order.shipping) > 0) {
      const shipName = "Shipping Fee";
      const shipId = await getOrCreateProductId(baseUrl, db, uid, apiKey, shipName, order.shipping);
      lines.push([
        0,
        0,
        { product_id: shipId, name: shipName, product_uom_qty: 1, price_unit: Number(order.shipping) },
      ]);
    }

    if (Number(order.discount) > 0) {
      const discName = order.coupon ? `Discount (${order.coupon})` : "Discount";
      const discId = await getOrCreateProductId(baseUrl, db, uid, apiKey, discName, 0);
      lines.push([
        0,
        0,
        { product_id: discId, name: discName, product_uom_qty: 1, price_unit: -Math.abs(Number(order.discount)) },
      ]);
    }

    const notes = [];
    if (order.payment?.method) {
      notes.push(`Payment: ${order.payment.method}${order.payment.trx ? ` · Trx: ${order.payment.trx}` : ""}`);
    }
    if (order.coupon) notes.push(`Coupon: ${order.coupon}`);
    if (order.address.notes) notes.push(`Customer notes: ${order.address.notes}`);

    const dateOrder = order.date ? new Date(order.date) : new Date();
    const dateStr = new Date(dateOrder.getTime() - dateOrder.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    const orderVals = {
      partner_id: partnerId,
      partner_invoice_id: partnerId,
      partner_shipping_id: partnerId,
      date_order: dateStr,
      origin: order.orderId || undefined,
      note: notes.length ? notes.join("\n") : undefined,
      order_line: lines,
    };

    const saleOrderId = await executeKw(
      baseUrl,
      db,
      uid,
      apiKey,
      "sale.order",
      "create",
      [orderVals]
    );

    res.status(200).json({ ok: true, odooOrderId: saleOrderId });
  } catch (err) {
    res.status(500).json({ error: err?.message || "Odoo sync failed" });
  }
}
