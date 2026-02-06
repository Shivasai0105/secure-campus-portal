const AuditLog = require("../models/AuditLog");

const logAudit = async ({ userId, role, action, ip, metadata }) => {
  try {
    await AuditLog.create({
      userId,
      role,
      action,
      ip,
      metadata
    });
  } catch (error) {
    console.error("Audit log write failed");
    console.error(error.message);
  }
};

module.exports = { logAudit };
