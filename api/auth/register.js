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

  const firstName = String(body?.firstName || "").trim();
  const lastName = String(body?.lastName || "").trim();
  const phone = String(body?.phone || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");

  if (!firstName || !lastName) {
    res.status(400).json({ error: "Name required" });
    return;
  }
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  try {
    const db = await getDb();
    const users = db.collection("users");
    const existing = await users.findOne({ email });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();
    const result = await users.insertOne({
      firstName,
      lastName,
      phone: phone || null,
      email,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });

    const user = {
      id: result.insertedId.toString(),
      firstName,
      lastName,
      phone: phone || null,
      email,
    };

    const token = signToken({ id: user.id, email: user.email });
    setAuthCookie(res, token);
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ error: err?.message || "Registration failed" });
  }
}
