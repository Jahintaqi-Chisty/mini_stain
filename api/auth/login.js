import bcrypt from "bcryptjs";
import { getDb } from "../_db.js";
import { signToken, setAuthCookie } from "./_utils.js";

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

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let body;
  try {
    body = await readJson(req);
  } catch {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }

  try {
    const db = await getDb();
    const users = db.collection("users");
    const userDoc = await users.findOne({ email });
    if (!userDoc || !userDoc.passwordHash) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const ok = await bcrypt.compare(password, userDoc.passwordHash);
    if (!ok) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const user = {
      id: userDoc._id.toString(),
      firstName: userDoc.firstName || "",
      lastName: userDoc.lastName || "",
      phone: userDoc.phone || null,
      email: userDoc.email,
    };

    const token = signToken({ id: user.id, email: user.email });
    setAuthCookie(res, token);
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ error: err?.message || "Login failed" });
  }
}
