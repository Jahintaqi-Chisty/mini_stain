import jwt from "jsonwebtoken";

const COOKIE_NAME = "ms_auth";
const TOKEN_TTL = 60 * 60 * 24 * 7; // 7 days

function parseCookies(req) {
  const header = req.headers?.cookie || "";
  return header.split(";").reduce((acc, part) => {
    const [key, ...rest] = part.trim().split("=");
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

function getAuthToken(req) {
  const cookies = parseCookies(req);
  return cookies[COOKIE_NAME];
}

function signToken(payload) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Missing env: AUTH_SECRET");
  return jwt.sign(payload, secret, { expiresIn: TOKEN_TTL });
}

function verifyToken(token) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Missing env: AUTH_SECRET");
  return jwt.verify(token, secret);
}

function setAuthCookie(res, token) {
  const secure = process.env.NODE_ENV === "production";
  const cookie = `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${TOKEN_TTL}${secure ? "; Secure" : ""}`;
  res.setHeader("Set-Cookie", cookie);
}

function clearAuthCookie(res) {
  const secure = process.env.NODE_ENV === "production";
  const cookie = `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
  res.setHeader("Set-Cookie", cookie);
}

export { COOKIE_NAME, TOKEN_TTL, parseCookies, getAuthToken, signToken, verifyToken, setAuthCookie, clearAuthCookie };
