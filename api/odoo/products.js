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

function pickColor(attrs) {
  const byName = (attrs || []).find((a) => a.attributeName && /colou?r/i.test(a.attributeName));
  const value = (byName?.name || "").toLowerCase();
  if (value.includes("silver")) return "#C0C0C0";
  if (value.includes("gold")) return "#D4AF37";
  if (value.includes("rose")) return "#B76E79";
  if (value.includes("black")) return "#2A2A2A";
  if (value.includes("white")) return "#F5F5F5";
  if (value.includes("blue")) return "#5B8DD9";
  if (value.includes("green")) return "#5AB88A";
  if (value.includes("red")) return "#D95B5B";
  if (value.includes("pink")) return "#E8A1B5";
  if (value.includes("gray") || value.includes("grey")) return "#7A7A7A";
  return "#C0C0C0";
}

function buildVariantLabel(attrs, sizeValues) {
  const nonSize = (attrs || [])
    .filter((a) => !/size/i.test(a.attributeName || ""))
    .map((a) => a.name)
    .filter(Boolean);
  if (nonSize.length > 0) return nonSize.join(" / ");
  if (sizeValues.length > 0) return sizeValues[0];
  return "Default";
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
      "display_name",
      "product_tmpl_id",
      "product_template_id",
      "attribute_value_ids",
      "product_variant_id",
      "image_1920",
      "qty_available",
      "virtual_available",
      "sale_ok",
      "website_published",
      "is_published",
      "list_price",
      "lst_price",
    ];

    const fieldsInfo = await executeKw(
      baseUrl,
      db,
      uid,
      apiKey,
      "product.product",
      "fields_get",
      [desired],
      { attributes: ["type"] }
    );
    const fields = desired.filter((f) => fieldsInfo && fieldsInfo[f]);
    const domain = [];
    if (fieldsInfo?.sale_ok) domain.push(["sale_ok", "=", true]);
    if (fieldsInfo?.website_published) domain.push(["website_published", "=", true]);
    if (fieldsInfo?.is_published) domain.push(["is_published", "=", true]);
    const tmplField = fieldsInfo?.product_tmpl_id
      ? "product_tmpl_id"
      : fieldsInfo?.product_template_id
        ? "product_template_id"
        : null;

    const rows = await executeKw(
      baseUrl,
      db,
      uid,
      apiKey,
      "product.product",
      "search_read",
      [domain],
      { fields }
    );

    const nowIso = new Date().toISOString();
    const items = Array.isArray(rows) ? rows : [];

    const templateIds = new Set();
    items.forEach((r) => {
      const t = tmplField ? r[tmplField] : null;
      const tid = Array.isArray(t) ? t[0] : t;
      if (tid) templateIds.add(tid);
    });

    const tmplDesired = [
      "id",
      "name",
      "description_sale",
      "categ_id",
      "list_price",
      "image_1920",
      "website_published",
      "is_published",
    ];
    const tmplFieldsInfo = await executeKw(
      baseUrl,
      db,
      uid,
      apiKey,
      "product.template",
      "fields_get",
      [tmplDesired],
      { attributes: ["type"] }
    );
    const tmplFields = tmplDesired.filter((f) => tmplFieldsInfo && tmplFieldsInfo[f]);
    const tmplPublishField = tmplFieldsInfo?.website_published
      ? "website_published"
      : tmplFieldsInfo?.is_published
        ? "is_published"
        : null;
    const tmplRows = templateIds.size
      ? await executeKw(
          baseUrl,
          db,
          uid,
          apiKey,
          "product.template",
          "search_read",
          [[[ "id", "in", Array.from(templateIds) ]]],
          { fields: tmplFields }
        )
      : [];
    const tmplMap = new Map((Array.isArray(tmplRows) ? tmplRows : []).map((t) => [t.id, t]));

    const attrValueIds = new Set();
    items.forEach((r) => {
      const ids = Array.isArray(r.attribute_value_ids) ? r.attribute_value_ids : [];
      ids.forEach((id) => attrValueIds.add(id));
    });
    const attrMap = new Map();
    if (attrValueIds.size) {
      const attrRows = await executeKw(
        baseUrl,
        db,
        uid,
        apiKey,
        "product.attribute.value",
        "search_read",
        [[[ "id", "in", Array.from(attrValueIds) ]]],
        { fields: ["id", "name", "attribute_id"] }
      );
      (Array.isArray(attrRows) ? attrRows : []).forEach((a) => {
        const attributeName = Array.isArray(a.attribute_id) ? a.attribute_id[1] : a.attribute_id;
        attrMap.set(a.id, { name: a.name, attributeName });
      });
    }

    const productMap = new Map();

    items.forEach((r) => {
      const t = tmplField ? r[tmplField] : null;
      const templateId = Array.isArray(t) ? t[0] : t;
      const tmpl = tmplMap.get(templateId) || {};
      if (tmplPublishField && tmpl[tmplPublishField] === false) return;
      const category = Array.isArray(tmpl.categ_id) ? tmpl.categ_id[1] : tmpl.categ_id || "Uncategorized";

      if (!productMap.has(templateId)) {
        productMap.set(templateId, {
          id: templateId || r.id,
          odooTemplateId: templateId || null,
          name: tmpl.name || r.display_name || "",
          price: Number(tmpl.list_price || r.lst_price || r.list_price || 0),
          originalPrice: Number(tmpl.list_price || r.lst_price || r.list_price || 0),
          category,
          description: tmpl.description_sale || "",
          variants: [],
          sizes: [],
          stock: 0,
          tags: [],
          salePercent: 0,
          syncedAt: nowIso,
          syncError: null,
        });
      }

      const base = productMap.get(templateId);
      const attrs = (Array.isArray(r.attribute_value_ids) ? r.attribute_value_ids : [])
        .map((id) => attrMap.get(id))
        .filter(Boolean);
      const sizeValues = attrs
        .filter((a) => /size/i.test(a.attributeName || ""))
        .map((a) => a.name)
        .filter(Boolean);
      sizeValues.forEach((s) => {
        if (!base.sizes.includes(s)) base.sizes.push(s);
      });

      const variantHasImage = !!r.image_1920;
      const templateHasImage = !!tmpl.image_1920;
      const variantUrl = `${baseUrl}/web/image/product.product/${r.id}/image_1920`;
      const templateUrl = templateId ? `${baseUrl}/web/image/product.template/${templateId}/image_1920` : "";
      const image = variantHasImage ? variantUrl : templateHasImage ? templateUrl : "";
      const stockVal =
        typeof r.qty_available === "number"
          ? r.qty_available
          : typeof r.virtual_available === "number"
            ? r.virtual_available
            : 0;
      base.stock += Number(stockVal || 0);
      base.variants.push({
        label: buildVariantLabel(attrs, sizeValues),
        color: pickColor(attrs),
        images: image ? [image] : [],
        odooProductId: r.id,
      });
    });

    const mapped = Array.from(productMap.values()).map((p) => ({
      ...p,
      sizes: p.sizes.sort(),
    }));

    res.status(200).json(mapped);
  } catch (err) {
    res.status(500).json({ error: err?.message || "Odoo product sync failed" });
  }
}
