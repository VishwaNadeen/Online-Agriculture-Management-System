import jwt from "jsonwebtoken";

const COOKIE_NAME = "user_token";

// Pull JWT from cookie or "Authorization: Bearer <token>"
const getToken = (req) => {
  const fromCookie = req.cookies?.[COOKIE_NAME];
  const auth = req.headers.authorization || "";
  const fromHeader = auth.startsWith("Bearer ") ? auth.slice(7) : undefined;
  return fromCookie || fromHeader;
};

// Require a valid JWT; attaches payload to req.user
export function requireAuth(req, res, next) {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ authenticated: false, message: "Not logged in" });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      // Fail fast if misconfigured
      return res.status(500).json({ message: "Server misconfigured: missing JWT_SECRET" });
    }
    req.user = jwt.verify(token, secret); // e.g. { sub, role, iat, exp }
    return next();
  } catch {
    return res.status(401).json({ authenticated: false, message: "Invalid or expired token" });
  }
}

// Allow only the user themself or an admin
export function selfOrAdmin(req, res, next) {
  const uid = req.user?.sub;
  const role = req.user?.role;
  if (role === "admin" || uid === req.params.id) return next();
  return res.status(403).json({ message: "Forbidden" });
}
