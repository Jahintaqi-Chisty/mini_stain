import { getDb } from "../_db.js";
import { getAuthToken, verifyToken } from "../auth/_utils.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const token = getAuthToken(req);
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    res.status(401).json({ error: "Invalid session" });
    return;
  }

  try {
    const db = await getDb();
    const orders = db.collection("orders");
    const rows = await orders
      .find({ userId: String(payload.id) })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const data = rows.map((o) => ({
      id: o._id.toString(),
      orderId: o.orderId || null,
      odooOrderId: o.odooOrderId || null,
      status: o.status || "Pending",
      coupon: o.coupon || null,
      discount: Number(o.discount || 0),
      shipping: Number(o.shipping || 0),
      total: Number(o.total || 0),
      payment: o.payment || null,
      address: o.address || null,
      items: Array.isArray(o.items) ? o.items : [],
      createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : null,
    }));

    res.status(200).json({ orders: data });
  } catch (err) {
    res.status(500).json({ error: err?.message || "Failed to load orders" });
  }
}
