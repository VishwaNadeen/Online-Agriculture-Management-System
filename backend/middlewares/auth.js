// backend/middlewares/auth.js
import jwt from "jsonwebtoken";

const COOKIE_NAME = "user_token";

// Generic auth check
export function requireAuth(req, res, next) {
  const token =
    req.cookies?.[COOKIE_NAME] ||
    req.headers.authorization?.split(" ")?.[1];

  if (!token) return res.status(401).json({ authenticated: false, message: "Not logged in" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;        // attach whole payload
    next();
  } catch {
    return res.status(401).json({ authenticated: false, message: "Invalid or expired token" });
  }
}

// Self or admin check
export function selfOrAdmin(req, res, next) {
  // Assuming payload includes { sub: userId, role: 'user'|'admin' }
  if (req.user.role === "admin" || req.user.sub === req.params.id) {
    return next();
  }
  return res.status(403).json({ message: "Forbidden" });
}
