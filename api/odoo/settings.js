const REQUIRED_ENV = ["ODOO_BASE_URL", "ODOO_DB", "ODOO_USER", "ODOO_API_KEY"];
const THEME_KEY = "ministain.theme";

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
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET" && req.method !== "POST") {
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

    if (req.method === "GET") {
      const value = await executeKw(
        baseUrl,
        db,
        uid,
        apiKey,
        "ir.config_parameter",
        "get_param",
        [THEME_KEY, ""]
      );
      res.status(200).json({ theme: value || "" });
      return;
    }

    let payload;
    try {
      payload = await readJson(req);
    } catch {
      res.status(400).json({ error: "Invalid JSON body" });
      return;
    }

    const theme = String(payload?.theme || "").trim();
    if (!theme) {
      res.status(400).json({ error: "Theme is required" });
      return;
    }

    await executeKw(
      baseUrl,
      db,
      uid,
      apiKey,
      "ir.config_parameter",
      "set_param",
      [THEME_KEY, theme]
    );

    res.status(200).json({ ok: true, theme });
  } catch (err) {
    res.status(500).json({ error: err?.message || "Odoo settings sync failed" });
  }
}
