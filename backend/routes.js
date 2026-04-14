const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const { authenticate, authorizeRoles } = require("./middleware/auth");
const { uploadUsage, getUsage } = require("./controllers/usageController");
const { getAlerts, updateAlert, deleteAlert } = require("./controllers/alertController");

const router = express.Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createToken = (user) =>
  jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET || "dev-jwt-secret",
    { expiresIn: "7d" },
  );

const buildAuthPayload = (user) => ({
  token: createToken(user),
  user: user.toSafeObject(),
});

// ── Auth ──────────────────────────────────────────────────────────────────────

router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email, and password are required." });
    if (!emailRegex.test(email))
      return res.status(400).json({ error: "Please enter a valid email address." });
    if (String(password).length < 6)
      return res.status(400).json({ error: "Password must be at least 6 characters long." });

    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail }).lean())
      return res.status(409).json({ error: "An account with this email already exists." });

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: role === "Admin" ? "Admin" : "User",
    });
    return res.status(201).json({ message: "Registration successful.", ...buildAuthPayload(user) });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required." });

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: "Invalid email or password." });

    return res.json({ message: "Login successful.", ...buildAuthPayload(user) });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// ── Users (Admin only) ────────────────────────────────────────────────────────

router.get("/users", authenticate, authorizeRoles("Admin"), async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    return res.json(users.map((u) => ({
      id: u._id.toString(), name: u.name, email: u.email, role: u.role, createdAt: u.createdAt,
    })));
  } catch (error) {
    console.error("Fetch users error:", error);
    return res.status(500).json({ error: "Failed to fetch users." });
  }
});

router.delete("/users/:id", authenticate, authorizeRoles("Admin"), async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id === id)
      return res.status(400).json({ error: "Admin accounts cannot delete themselves." });
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "User not found." });
    return res.json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ error: "Failed to delete user." });
  }
});

// ── Profile ───────────────────────────────────────────────────────────────────

// GET /api/profile
router.get("/profile", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ error: "User not found." });
    return res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ error: "Failed to fetch profile." });
  }
});

// PATCH /api/profile — update name only, bypasses pre-save hook via updateOne
router.patch("/profile", authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !String(name).trim())
      return res.status(400).json({ error: "Name is required." });

    const result = await User.updateOne(
      { _id: req.user.id },
      { $set: { name: String(name).trim() } },
    );

    if (result.matchedCount === 0)
      return res.status(404).json({ error: "User not found." });

    const updated = await User.findById(req.user.id).lean();
    return res.json({
      message: "Profile updated successfully.",
      user: {
        id: updated._id.toString(),
        name: updated.name,
        email: updated.email,
        role: updated.role,
        createdAt: updated.createdAt,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    return res.status(500).json({ error: error.message || "Failed to update profile." });
  }
});

// PATCH /api/profile/password
router.patch("/profile/password", authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: "Current and new passwords are required." });
    if (newPassword.length < 8)
      return res.status(400).json({ error: "New password must be at least 8 characters." });
    if (currentPassword === newPassword)
      return res.status(400).json({ error: "New password must differ from current password." });

    const user = await User.findById(req.user.id).select("+password");
    if (!user) return res.status(404).json({ error: "User not found." });

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) return res.status(401).json({ error: "Current password is incorrect." });

    user.password = newPassword; // pre-save hook hashes it
    await user.save();

    return res.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Change password error:", error.message);
    return res.status(500).json({ error: error.message || "Failed to update password." });
  }
});

// ── Usage & Alerts ────────────────────────────────────────────────────────────

router.post("/upload", authenticate, uploadUsage);
router.get("/usage", authenticate, getUsage);
router.get("/alerts", authenticate, getAlerts);
router.patch("/alerts/:id", authenticate, updateAlert);
router.delete("/alerts/:id", authenticate, deleteAlert);

module.exports = router;
