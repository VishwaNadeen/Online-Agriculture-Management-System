// controllers/userCtrl.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

/* ---------- env admin config ---------- */
const {
  ADMIN_EMAIL = "",
  ADMIN_PASSWORD_HASH = "",
  ADMIN_PASSWORD = "", // optional plaintext fallback (not recommended)
} = process.env;

/* ---------- helpers ---------- */
const signTokenIfPossible = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  // support virtual admin id
  const sub = user._id || user.id || user.sub || "unknown";
  const role = user.role || "user";
  return jwt.sign({ sub, role }, secret, { expiresIn: "7d" });
};

// Accept either `address: { ... }` or flat address fields in body
const buildAddressFromBody = (body) => {
  if (body.address && typeof body.address === "object") return body.address;
  const { country, stateProvince, city, postalCode, line1, line2 } = body;
  const any = country || stateProvince || city || postalCode || line1 || line2;
  return any ? { country, stateProvince, city, postalCode, line1, line2 } : undefined;
};

// Whitelist top-level updatable fields (LOCK: email, role, profilePicture not updatable here)
const pickUpdatable = (body) => {
  const allowedTop = [
    "firstName",
    "lastName",
    "phone",
    "dateOfBirth",
    "gender",
    "role",
    // "email", "role", "profilePicture" are intentionally excluded on updates
  ];

  const out = {};
  for (const k of allowedTop) if (body[k] !== undefined) out[k] = body[k];

  // address
  const addr = buildAddressFromBody(body);
  if (addr) out.address = addr;

  // nested role sections
  if (body.farmer && typeof body.farmer === "object") out.farmer = body.farmer;
  if (body.consultant && typeof body.consultant === "object") out.consultant = body.consultant;

  return out;
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
      profilePicture, // Cloudinary URL (set in route if file uploaded)
      password,
      role,        // "user" | "farmer" | "consultant" | "admin"
      farmer,
      consultant,
    } = req.body;

    if (!firstName || !lastName || !phone || !email || !dateOfBirth || !gender || !password) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const address = buildAddressFromBody(req.body);
    if (!address) return res.status(400).json({ message: "Address is required." });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      firstName,
      lastName,
      phone: String(phone).trim(),
      email: String(email).toLowerCase().trim(),
      dateOfBirth,
      gender,
      profilePicture, // may be undefined if no file uploaded
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

    const val = String(emailOrPhone).trim();
    const isEmail = val.includes("@");

    /* -------- 1) ENV ADMIN LOGIN (no DB lookup) -------- */
    if (isEmail && ADMIN_EMAIL && val.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      if (!ADMIN_PASSWORD_HASH && !ADMIN_PASSWORD) {
        return res.status(500).json({ message: "Admin password not configured" });
      }

      let ok = false;
      if (ADMIN_PASSWORD_HASH) {
        ok = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
      } else if (ADMIN_PASSWORD) {
        ok = password === ADMIN_PASSWORD; // plaintext fallback (not recommended)
      }

      if (!ok) return res.status(401).json({ message: "Invalid credentials." });

      const adminUser = {
        id: "env-admin",
        firstName: "Admin",
        lastName: "User",
        email: ADMIN_EMAIL,
        role: "admin",
      };

      const token = signTokenIfPossible(adminUser);
      return res.json({
        message: "Login successful",
        ...(token ? { token } : {}),
        user: adminUser,
      });
    }

    /* -------- 2) NORMAL DB LOGIN (unchanged) -------- */
    const query = isEmail
      ? { email: val.toLowerCase() }
      : { phone: val };

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

    res.json({ total, page: Number(page), limit: Number(limit), users });
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
    res.json(user);
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

    // normalize phone if present
    if (updates.phone) updates.phone = String(updates.phone).trim();

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    // IMPORTANT: return the plain user (matches GET shape)
    res.json(user);
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

const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const requesterId = req.user?.sub || req.user?._id?.toString();
    const requesterRole = req.user?.role;

    const target = await User.findById(id);
    if (!target) return res.status(404).json({ message: "User not found" });

    const isSelf = requesterId && String(requesterId) === String(id);
    const isAdmin = requesterRole === "admin";

    // Only require password for self-deletion by non-admin users
    // Note: env-admin cannot delete themselves since they don't exist in the database
    if (isSelf && !isAdmin) {
      const { currentPassword } = req.body || {};
      if (!currentPassword) {
        return res.status(400).json({ message: "currentPassword is required to delete your account." });
      }
      const ok = await bcrypt.compare(currentPassword, target.password);
      if (!ok) {
        return res.status(401).json({ message: "Password is incorrect." });
      }
    }
    // Admin users can delete anyone without requiring the target user's password

    await User.findByIdAndDelete(id);
    return res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ message: "Failed to delete user", error: err.message });
  }
};

const userCtrl = { create, login, list, get, update, changePassword, remove };
export default userCtrl;
