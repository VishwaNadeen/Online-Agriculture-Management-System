import express from "express";

const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (
    username === process.env.ADMIN_EMAIL &&
    password === process.env.ADMIN_PASSWORD
  ) {
    // Optionally generate a token here
    return res.json({ message: "Admin login successful" });
  }
  res.status(401).json({ message: "Invalid credentials" });
});

// ❌ module.exports = router;
export default router;   // ✅ Use ESM default export
