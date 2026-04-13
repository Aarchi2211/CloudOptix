const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Authentication token is required." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev-jwt-secret");
    const user = await User.findById(decoded.sub).lean();

    if (!user) {
      return res.status(401).json({ error: "User no longer exists." });
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required." });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: "You do not have permission to access this resource." });
  }

  return next();
};

module.exports = {
  authenticate,
  authorizeRoles,
};
