import { ObjectId } from "mongodb";
import { getDb } from "../_db.js";
import { getAuthToken, verifyToken } from "./_utils.js";

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
    const users = db.collection("users");
    const userDoc = await users.findOne({ _id: new ObjectId(payload.id) });
    if (!userDoc) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const user = {
      id: userDoc._id.toString(),
      firstName: userDoc.firstName || "",
      lastName: userDoc.lastName || "",
      phone: userDoc.phone || null,
      email: userDoc.email,
    };

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ error: err?.message || "Failed to load user" });
  }
}
