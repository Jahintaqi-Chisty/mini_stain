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

function toImageDataUrl(imageBase64) {
  if (!imageBase64) return "";
  return `data:image/png;base64,${imageBase64}`;
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

    const desired = [
      "id",
      "name",
      "list_price",
      "description_sale",
      "categ_id",
      "product_variant_id",
      "image_1920",
      "qty_available",
      "virtual_available",
      "sale_ok",
    ];

    const fieldsInfo = await executeKw(
      baseUrl,
      db,
      uid,
      apiKey,
      "product.template",
      "fields_get",
      [desired],
      { attributes: ["type"] }
    );
    const fields = desired.filter((f) => fieldsInfo && fieldsInfo[f]);
    const domain = fieldsInfo?.sale_ok ? [["sale_ok", "=", true]] : [];

    const rows = await executeKw(
      baseUrl,
      db,
      uid,
      apiKey,
      "product.template",
      "search_read",
      [domain],
      { fields }
    );

    const nowIso = new Date().toISOString();
    const mapped = (Array.isArray(rows) ? rows : []).map((r) => {
      const image = toImageDataUrl(r.image_1920);
      const category = Array.isArray(r.categ_id) ? r.categ_id[1] : r.categ_id || "Uncategorized";
      const variant = Array.isArray(r.product_variant_id) ? r.product_variant_id[0] : r.product_variant_id;
      const templateId = r.id;
      const productId = variant || templateId;
      const stockVal =
        typeof r.qty_available === "number"
          ? r.qty_available
          : typeof r.virtual_available === "number"
            ? r.virtual_available
            : 0;
      return {
        id: productId,
        odooProductId: productId,
        odooTemplateId: templateId,
        name: r.name || "",
        price: Number(r.list_price || 0),
        originalPrice: Number(r.list_price || 0),
        category: category || "Uncategorized",
        description: r.description_sale || "",
        variants: [{ label: "Default", color: "#C0C0C0", images: image ? [image] : [] }],
        sizes: [],
        stock: Number(stockVal || 0),
        tags: [],
        salePercent: 0,
        syncedAt: nowIso,
        syncError: null,
      };
    });

    res.status(200).json(mapped);
  } catch (err) {
    res.status(500).json({ error: err?.message || "Odoo product sync failed" });
  }
}
