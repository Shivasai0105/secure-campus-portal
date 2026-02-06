const bcrypt = require("bcryptjs");
const Notice = require("../models/Notice");
const AuditLog = require("../models/AuditLog");
const User = require("../models/User");
const { logAudit } = require("../utils/auditLogger");

const createNotice = async (req, res) => {
  try {
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: "Title and body are required" });
    }

    const notice = await Notice.create({
      title: title.trim(),
      body: body.trim(),
      createdBy: req.user.id
    });

    await logAudit({
      userId: req.user.id,
      role: req.user.role,
      action: "NOTICE_CREATE",
      ip: req.ip,
      metadata: { noticeId: notice._id }
    });

    return res.status(201).json({ notice });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const skip = parseInt(req.query.skip, 10) || 0;

    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.json({ logs, limit, skip });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const listUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("name email role createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ users });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const createUser = async (req, res) => {
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

    return res.status(201).json({
      user: {
        id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createNotice,
  getAuditLogs,
  listUsers,
  createUser
};
