const express = require("express");
const {
  createNotice,
  getAuditLogs,
  listUsers,
  createUser
} = require("../controllers/adminController");
const { requireAuth } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(requireAuth, requireRole(["admin"]));

router.post("/notices", createNotice);
router.get("/audit-logs", getAuditLogs);
router.get("/users", listUsers);
router.post("/users", createUser);

module.exports = router;
