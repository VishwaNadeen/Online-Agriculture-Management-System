// controllers/userCtrl.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { sendPasswordCodeEmail } from "../utils/mailer.js";

/* ---------- env admin & reset config ---------- */
const {
  ADMIN_EMAIL = "",
  ADMIN_PASSWORD_HASH = "",
  ADMIN_PASSWORD = "", // optional plaintext fallback (not recommended)
  RESET_CODE_TTL_MINUTES = "10",
  RESET_MAX_ATTEMPTS = "5",
  RESET_LOCK_MINUTES = "15",
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

// ---------- reset helpers ----------
function inFuture(date) {
  return date && new Date(date).getTime() > Date.now();
}

function minutesFromNow(n) {
  return new Date(Date.now() + n * 60 * 1000);
}

function generateNumericCode(len = 6) {
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
  if (s[0] === "0") s = String(1 + Math.floor(Math.random() * 9)) + s.slice(1);
  return s;
}

// Neutral message to avoid user enumeration
const NEUTRAL_OK = { message: "If that account exists, an email has been sent (if eligible)." };

/* ======================================================================
   Core CRUD + Auth
====================================================================== */
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

    /* -------- 2) NORMAL DB LOGIN -------- */
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

/* ======================================================================
   Password Reset Flow
   1) requestPasswordReset -> send 6-digit code to email (for users in DB only).
   2) verifyPasswordCode   -> verify the code without changing the password.
   3) setNewPassword       -> set the password when code is valid.
====================================================================== */

// 1) Request reset (send code)
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: "email is required" });

    const val = String(email).toLowerCase().trim();

    // ENV-admin is not a DB user; silently return neutral message
    if (ADMIN_EMAIL && val === ADMIN_EMAIL.toLowerCase()) {
      return res.json(NEUTRAL_OK);
    }

    const user = await User.findOne({ email: val });
    if (!user) return res.json(NEUTRAL_OK);

    // Check lockout
    if (inFuture(user.resetLockedUntil)) {
      return res.json(NEUTRAL_OK);
    }

    const code = generateNumericCode(6);
    const hash = await bcrypt.hash(code, 10);
    user.resetCodeHash = hash;
    user.resetCodeExpiresAt = minutesFromNow(Number(RESET_CODE_TTL_MINUTES));
    user.resetAttempts = 0;
    user.resetLockedUntil = undefined;
    await user.save();

    // Send email
    try {
      await sendPasswordCodeEmail({ to: user.email, code });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Clear the reset code if email fails
      user.resetCodeHash = undefined;
      user.resetCodeExpiresAt = undefined;
      user.resetAttempts = 0;
      await user.save();
      return res.status(500).json({ message: "Failed to send reset code. Please try again later." });
    }

    return res.json(NEUTRAL_OK);
  } catch (err) {
    console.error("requestPasswordReset error:", err);
    return res.status(500).json({ message: "Failed to process request", error: err.message });
  }
};

// 2) Verify code
const verifyPasswordCode = async (req, res) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) return res.status(400).json({ message: "email and code are required" });

    const val = String(email).toLowerCase().trim();

    // ENV-admin not supported
    if (ADMIN_EMAIL && val === ADMIN_EMAIL.toLowerCase()) {
      return res.status(400).json({ message: "Reset not available for this account." });
    }

    const user = await User.findOne({ email: val });
    // Always neutral if user missing
    if (!user || !user.resetCodeHash || !user.resetCodeExpiresAt) {
      return res.status(401).json({ message: "Invalid or expired code." });
    }

    // Lockout?
    if (inFuture(user.resetLockedUntil)) {
      return res.status(401).json({ message: "Invalid or expired code." });
    }

    // Expired?
    if (new Date(user.resetCodeExpiresAt).getTime() < Date.now()) {
      // expire the window
      user.resetCodeHash = undefined;
      user.resetCodeExpiresAt = undefined;
      user.resetAttempts = 0;
      await user.save();
      return res.status(401).json({ message: "Invalid or expired code." });
    }

    // Compare
    const ok = await bcrypt.compare(String(code), user.resetCodeHash);
    if (!ok) {
      user.resetAttempts = (user.resetAttempts || 0) + 1;
      // Lock if exceeds
      if (user.resetAttempts >= Number(RESET_MAX_ATTEMPTS)) {
        user.resetLockedUntil = minutesFromNow(Number(RESET_LOCK_MINUTES));
      }
      await user.save();
      return res.status(401).json({ message: "Invalid or expired code." });
    }

    return res.json({ message: "Code verified." });
  } catch (err) {
    console.error("verifyPasswordCode error:", err);
    return res.status(500).json({ message: "Verification failed", error: err.message });
  }
};

// 3) Set new password (requires valid code)
const setNewPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body || {};
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "email, code and newPassword are required" });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }

    const val = String(email).toLowerCase().trim();

    // ENV-admin not supported
    if (ADMIN_EMAIL && val === ADMIN_EMAIL.toLowerCase()) {
      return res.status(400).json({ message: "Reset not available for this account." });
    }

    const user = await User.findOne({ email: val });
    if (!user || !user.resetCodeHash || !user.resetCodeExpiresAt) {
      return res.status(401).json({ message: "Invalid or expired code." });
    }

    // Lockout?
    if (inFuture(user.resetLockedUntil)) {
      return res.status(401).json({ message: "Invalid or expired code." });
    }

    // Expired?
    if (new Date(user.resetCodeExpiresAt).getTime() < Date.now()) {
      user.resetCodeHash = undefined;
      user.resetCodeExpiresAt = undefined;
      user.resetAttempts = 0;
      await user.save();
      return res.status(401).json({ message: "Invalid or expired code." });
    }

    const ok = await bcrypt.compare(String(code), user.resetCodeHash);
    if (!ok) {
      user.resetAttempts = (user.resetAttempts || 0) + 1;
      if (user.resetAttempts >= Number(RESET_MAX_ATTEMPTS)) {
        user.resetLockedUntil = minutesFromNow(Number(RESET_LOCK_MINUTES));
      }
      await user.save();
      return res.status(401).json({ message: "Invalid or expired code." });
    }

    // Good to reset
    user.password = await bcrypt.hash(String(newPassword), 10);
    // Clear reset state
    user.resetCodeHash = undefined;
    user.resetCodeExpiresAt = undefined;
    user.resetAttempts = 0;
    user.resetLockedUntil = undefined;
    await user.save();

    return res.json({ message: "Password has been reset." });
  } catch (err) {
    console.error("setNewPassword error:", err);
    return res.status(500).json({ message: "Failed to reset password", error: err.message });
  }
};

/* ======================================================================
   Exports
====================================================================== */
const userCtrl = {
  create,
  login,
  list,
  get,
  update,
  changePassword,
  remove,
  // reset flow
  requestPasswordReset,
  verifyPasswordCode,
  setNewPassword,
};

export default userCtrl;
export {
  // named exports (optional for direct import in routes)
  create,
  login,
  list,
  get,
  update,
  changePassword,
  remove,
  requestPasswordReset,
  verifyPasswordCode,
  setNewPassword,
};
