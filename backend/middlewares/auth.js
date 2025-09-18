// middlewares/auth.js
import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.auth = payload; // { sub, role }
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const selfOrAdmin = (req, res, next) => {
  const isSelf = req.auth?.sub === req.params.id;
  const isAdmin = req.auth?.role === "admin";
  if (!isSelf && !isAdmin) return res.status(403).json({ message: "Forbidden" });
  next();
};
