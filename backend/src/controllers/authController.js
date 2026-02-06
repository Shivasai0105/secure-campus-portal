const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { logAudit } = require("../utils/auditLogger");

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
});

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["student", "faculty", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const createdUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: passwordHash,
      role
    });

    await logAudit({
      userId: req.user.id,
      role: req.user.role,
      action: "USER_CREATE",
      ip: req.ip,
      metadata: { createdUserId: createdUser._id, role }
    });

    return res.status(201).json({ user: sanitizeUser(createdUser) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) {
          return reject(err);
        }
        req.session.user = {
          id: user._id,
          role: user.role
        };
        return resolve();
      });
    });

    await logAudit({
      userId: user._id,
      role: user.role,
      action: "LOGIN",
      ip: req.ip
    });

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const logout = async (req, res) => {
  try {
    if (req.session && req.session.user) {
      await logAudit({
        userId: req.session.user.id,
        role: req.session.user.role,
        action: "LOGOUT",
        ip: req.ip
      });
    }

    req.session.destroy(() => {
      res.clearCookie("scpsid");
      return res.json({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    return res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  register,
  login,
  logout,
  me
};
