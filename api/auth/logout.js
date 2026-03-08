import { clearAuthCookie } from "./_utils.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  clearAuthCookie(res);
  res.status(200).json({ ok: true });
}
