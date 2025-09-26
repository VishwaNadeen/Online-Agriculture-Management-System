// controllers/userCtrl.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js"; // << ensure this matches your file name

// ---------- helpers ----------
const signTokenIfPossible = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  return jwt.sign({ sub: user._id, role: user.role }, secret, { expiresIn: "7d" });
};

// Accept either `address: { ... }` or flat address fields in body
const buildAddressFromBody = (body) => {
  if (body.address && typeof body.address === "object") return body.address;
  const { country, stateProvince, city, postalCode, line1, line2 } = body;
  const any = country || stateProvince || city || postalCode || line1 || line2;
  return any ? { country, stateProvince, city, postalCode, line1, line2 } : undefined;
};

// Whitelist top-level updatable fields
const pickUpdatable = (body) => {
  const allowedTop = [
    "firstName",
    "lastName",
    "phone",
    "email",
    "dateOfBirth",
    "gender",
    "profilePicture", // URL from Cloudinary (set in route)
    "role", // "user" | "farmer" | "consultant"
  ];

  const out = {};
  for (const k of allowedTop) if (body[k] !== undefined) out[k] = body[k];

  // address
  const addr = buildAddressFromBody(body);
  if (addr) out.address = addr;

  // nested role sections (replace or merge—simple replace here)
  if (body.farmer && typeof body.farmer === "object") out.farmer = body.farmer;
  if (body.consultant && typeof body.consultant === "object") out.consultant = body.consultant;

  return out;
};

// Hide sensitive fields when using .lean()
const stripSensitive = (doc) => {
  if (!doc) return doc;
  const { password, __v, ...clean } = doc;
  return clean;
};

// ---------- controller methods ----------
const create = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      email,
      dateOfBirth,
      gender,
      profilePicture, // must be a URL already (Cloudinary) — set in the route
      password,
      role,        // "user" | "farmer" | "consultant"
      farmer,      // optional object
      consultant,  // optional object
    } = req.body;

    // minimal required checks (model will enforce too)
    if (!firstName || !lastName || !phone || !email || !dateOfBirth || !gender || !password) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const address = buildAddressFromBody(req.body);
    if (!address) return res.status(400).json({ message: "Address is required." });

    // hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      phone: String(phone).trim(),
      email: String(email).toLowerCase().trim(),
      dateOfBirth,
      gender,
      profilePicture, // Cloudinary URL or undefined
      password: passwordHash,
      address,
      role: role || "user",
      farmer: role === "farmer" ? (farmer || {}) : undefined,
      consultant: role === "consultant" ? (consultant || {}) : undefined,
    });

    const token = signTokenIfPossible(user);
    res.status(201).json({
      message: "User created",
      ...(token ? { token } : {}),
      user, // password hidden by schema toJSON
    });
  } catch (err) {
    // handle duplicate keys nicely
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || "field";
      return res.status(409).json({ message: `Duplicate ${field}.` });
    }
    console.error("Create user error:", err);
    res.status(500).json({ message: "Failed to create user", error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) {
      return res.status(400).json({ message: "emailOrPhone and password are required." });
    }

    const query =
      String(emailOrPhone).includes("@")
        ? { email: String(emailOrPhone).toLowerCase().trim() }
        : { phone: String(emailOrPhone).trim() };

    const user = await User.findOne(query);
    if (!user) return res.status(401).json({ message: "Invalid credentials." });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials." });

    const token = signTokenIfPossible(user);
    res.json({
      message: "Login successful",
      ...(token ? { token } : {}),
      user, // password removed by toJSON
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

const list = async (req, res) => {
  try {
    const { q, role, page = 1, limit = 20, sort = "-createdAt" } = req.query;

    const filter = {};
    if (role) filter.role = role;

    if (q) {
      // Try text index, fallback to regex
      filter.$or = [
        { $text: { $search: q } },
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      total,
      page: Number(page),
      limit: Number(limit),
      users, // password hidden by toJSON
    });
  } catch (err) {
    console.error("List users error:", err);
    res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
};

const get = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user); // password hidden by toJSON
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Failed to fetch user", error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;

    // prevent password changes here; use changePassword
    if (req.body.password || req.body.newPassword) {
      return res.status(400).json({ message: "Use /:id/password to change password." });
    }

    const updates = pickUpdatable(req.body);

    // normalize email/phone if present
    if (updates.email) updates.email = String(updates.email).toLowerCase().trim();
    if (updates.phone) updates.phone = String(updates.phone).trim();

    const user = await User.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated", user });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0] || "field";
      return res.status(409).json({ message: `Duplicate ${field}.` });
    }
    console.error("Update user error:", err);
    res.status(500).json({ message: "Failed to update user", error: err.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "oldPassword and newPassword are required." });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(oldPassword, user.password);
    if (!ok) return res.status(401).json({ message: "Old password is incorrect." });

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Failed to change password", error: err.message });
  }
};

/**
 * DELETE /users/:id
 * - If requester is deleting their own account: require `currentPassword` in body
 * - If requester is an admin deleting someone else's account: no password required
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Must already be authenticated and authorized by middlewares
    const requesterId = req.user?.sub || req.user?._id?.toString();
    const requesterRole = req.user?.role;

    // Load target user first (to verify password when needed)
    const target = await User.findById(id);
    if (!target) return res.status(404).json({ message: "User not found" });

    const isSelf = requesterId && String(requesterId) === String(id);
    const isAdmin = requesterRole === "admin";

    if (isSelf && !isAdmin) {
      // Self-deletion: require password
      const { currentPassword } = req.body || {};
      if (!currentPassword) {
        return res.status(400).json({ message: "currentPassword is required to delete your account." });
      }
      const ok = await bcrypt.compare(currentPassword, target.password);
      if (!ok) {
        return res.status(401).json({ message: "Password is incorrect." });
      }
    }
    // Admin deleting others -> no password required

    await User.findByIdAndDelete(id);
    return res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Failed to delete user", error: err.message });
  }
};

// ---------- export in a familiar shape ----------
const userCtrl = { create, login, list, get, update, changePassword, remove };
export default userCtrl;
