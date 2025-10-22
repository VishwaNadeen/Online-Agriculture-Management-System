// backend/middlewares/auth.js
import jwt from "jsonwebtoken";
import User from "../models/userModel.js"; // adjust path if needed

/* -------------------- core auth -------------------- */
export async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");

    // Support multiple possible JWT claim names for the user id
    const userId = decoded.id || decoded._id || decoded.sub || decoded.userId;
    if (!userId) return res.status(401).json({ message: "Invalid token payload" });

    // Handle env-admin user (virtual user not in database)
    if (userId === "env-admin") {
      req.user = {
        _id: "env-admin",
        id: "env-admin",
        sub: "env-admin",
        role: "admin",
        firstName: "Admin",
        lastName: "User",
        email: process.env.ADMIN_EMAIL || "admin@example.com"
      };
      return next();
    }

    req.user = await User.findById(userId).lean();
    if (!req.user) return res.status(401).json({ message: "Invalid token user" });

    next();
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}

// keep these exports for compatibility
export { auth as requireAuth };
export default auth;

/* --------------- optional auth (non-blocking) --------------- */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    const userId = decoded.id || decoded._id || decoded.sub || decoded.userId;
    if (!userId) return next();

    const user = await User.findById(userId).lean();
    if (user) req.user = user;
    return next();
  } catch {
    // ignore invalid/expired tokens for optional flows
    return next();
  }
}

/* -------- self or admin helper (for user-owned resources) -------- */
export const selfOrAdmin = (paramName = "id") => (req, res, next) => {
  if (String(req.user?._id) === String(req.params[paramName]) || req.user?.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Forbidden: self or admin only" });
};

/* -------------------- role helpers -------------------- */
// require a specific role (e.g., "admin")
export const requireRole = (role) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (req.user.role !== role) return res.status(403).json({ message: `Forbidden: ${role}s only` });
  next();
};

// shorthand for admin-only
export const requireAdmin = (req, res, next) => requireRole("admin")(req, res, next);

// allow any of the provided roles
export const requireAnyRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (!roles.includes(req.user.role)) {
    return res
      .status(403)
      .json({ message: `Forbidden: roles [${roles.join(", ")}] only` });
  }
  next();
};
