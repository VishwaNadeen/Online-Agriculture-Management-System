// backend/middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/userModel.js"; // adjust path

export async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) return res.status(401).json({ message: "No token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");

    // Support multiple possible JWT claim names for the user id
    const userId = decoded.id || decoded._id || decoded.sub || decoded.userId;
    if (!userId) return res.status(401).json({ message: "Invalid token payload" });

    req.user = await User.findById(userId).lean();
    if (!req.user) return res.status(401).json({ message: "Invalid token user" });

    next();
  } catch (e) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
// ✅ add this line so routes can import { requireAuth }
export { auth as requireAuth };
export default auth; // optional, but handy

// ✅ add selfOrAdmin (tiny helper)
export const selfOrAdmin = (paramName = "id") => (req, res, next) => {
  if (String(req.user?._id) === String(req.params[paramName]) || req.user?.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Forbidden: self or admin only" });
};