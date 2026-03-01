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

function mapPromo(rec) {
  const code = rec.promo_code || rec.code || "";
  if (!code) return null;

  const label = rec.name || code;
  const active = rec.active !== false;
  const minOrder =
    typeof rec.minimum_amount === "number"
      ? rec.minimum_amount
      : typeof rec.rule_minimum_amount === "number"
        ? rec.rule_minimum_amount
        : 0;

  let type = "flat";
  let value = 0;

  if (rec.reward_type === "free_shipping" || rec.discount_type === "free_shipping") {
    type = "freeship";
    value = 0;
  } else if (rec.discount_type === "percentage" || typeof rec.discount_percentage === "number") {
    type = "percent";
    value = Number(rec.discount_percentage || 0);
  } else if (rec.discount_type === "fixed_amount" || typeof rec.discount_fixed_amount === "number") {
    type = "flat";
    value = Number(rec.discount_fixed_amount || 0);
  }

  return {
    id: rec.id,
    code: String(code).toUpperCase(),
    type,
    value,
    minOrder: Number(minOrder || 0),
    active,
    label,
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

    const desired = [
      "id",
      "name",
      "promo_code",
      "code",
      "active",
      "minimum_amount",
      "rule_minimum_amount",
      "discount_type",
      "discount_percentage",
      "discount_fixed_amount",
      "reward_type",
    ];

    let fieldsInfo = null;
    try {
      fieldsInfo = await executeKw(
        baseUrl,
        db,
        uid,
        apiKey,
        "coupon.program",
        "fields_get",
        [desired],
        { attributes: ["type"] }
      );
    } catch {
      res.status(500).json({ error: "coupon.program model not available in this Odoo instance" });
      return;
    }

    const fields = desired.filter((f) => fieldsInfo && fieldsInfo[f]);
    const domain = fieldsInfo?.active ? [["active", "=", true]] : [];

    const rows = await executeKw(
      baseUrl,
      db,
      uid,
      apiKey,
      "coupon.program",
      "search_read",
      [domain],
      { fields }
    );

    const mapped = (Array.isArray(rows) ? rows : [])
      .map(mapPromo)
      .filter(Boolean);

    res.status(200).json(mapped);
  } catch (err) {
    res.status(500).json({ error: err?.message || "Odoo promotions sync failed" });
  }
}
