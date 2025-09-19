import jwt from "jsonwebtoken";

const COOKIE_NAME = "user_token";

export function requireUser(req, res, next) {
  const token =
    req.cookies?.[COOKIE_NAME] ||
    req.headers.authorization?.split(" ")?.[1];

  if (!token) return res.status(401).json({ authenticated: false, message: "Not logged in" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ authenticated: false, message: "Invalid or expired token" });
  }
}