import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  
  console.log("🔵 Admin login attempt:", username);
  
  if (
    username === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    // Generate admin JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("❌ JWT_SECRET not configured");
      return res.status(500).json({ message: "Server configuration error" });
    }
    
    // Create admin user object
    const adminUser = {
      _id: "admin-virtual-id",
      id: "admin-virtual-id",
      email: process.env.ADMIN_EMAIL,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      status: "active"
    };
    
    // Generate token with admin role
    const token = jwt.sign(
      { 
        sub: adminUser._id,
        id: adminUser._id,
        role: "admin",
        email: adminUser.email
      }, 
      secret, 
      { expiresIn: "7d" }
    );
    
    console.log("✅ Admin login successful, role:", adminUser.role);
    
    return res.json({ 
      message: "Admin login successful",
      token,
      user: adminUser
    });
  }
  
  console.log("❌ Admin login failed - invalid credentials");
  res.status(401).json({ message: "Invalid credentials" });
});

export default router;
