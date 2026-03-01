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

export default async function handler(req, res) {
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

  const product = payload?.product ?? payload;
  if (!product || !product.name) {
    res.status(400).json({ error: "Invalid product payload" });
    return;
  }

  const baseUrl = String(process.env.ODOO_BASE_URL || "").replace(/\/+$/, "");
  const db = process.env.ODOO_DB;
  const user = process.env.ODOO_USER;
  const apiKey = process.env.ODOO_API_KEY;

  try {
    const uid = await odooLogin(baseUrl, db, user, apiKey);

    const listPrice = Number(product.price || product.originalPrice || 0);
    const vals = {
      name: String(product.name),
      list_price: listPrice,
      type: "consu",
    };
    if (product.description) {
      vals.description_sale = String(product.description);
    }

    let templateId = product.odooProductId ? Number(product.odooProductId) : null;
    if (templateId) {
      await executeKw(baseUrl, db, uid, apiKey, "product.template", "write", [[templateId], vals]);
      res.status(200).json({ ok: true, odooProductId: templateId, updated: true });
      return;
    }

    const found = await executeKw(
      baseUrl,
      db,
      uid,
      apiKey,
      "product.template",
      "search_read",
      [[["name", "=", String(product.name)]]],
      { fields: ["id"], limit: 1 }
    );
    if (Array.isArray(found) && found[0]?.id) {
      templateId = found[0].id;
      await executeKw(baseUrl, db, uid, apiKey, "product.template", "write", [[templateId], vals]);
      res.status(200).json({ ok: true, odooProductId: templateId, updated: true });
      return;
    }

    templateId = await executeKw(baseUrl, db, uid, apiKey, "product.template", "create", [vals]);
    res.status(200).json({ ok: true, odooProductId: templateId, created: true });
  } catch (err) {
    res.status(500).json({ error: err?.message || "Odoo sync failed" });
  }
}
