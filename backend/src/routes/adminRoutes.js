const express = require("express");
const {
  createNotice,
  getAuditLogs,
  listUsers,
  createUser,
  getPendingBonafideRequests,
  reviewBonafideRequest,
  bulkReviewBonafide,
  getFlaggedRequests,
  flagRequest,
  uploadCertificate,
  uploadFeeReceipt,
  generateCertificateForStudent
} = require("../controllers/adminController");
const { requireAuth } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.use(requireAuth, requireRole(["admin"]));

router.post("/notices", createNotice);
router.get("/audit-logs", getAuditLogs);
router.get("/users", listUsers);
router.post("/users", createUser);

// Bonafide request management
router.get("/bonafide-requests", getPendingBonafideRequests);
router.post("/bonafide-requests/:id/review", reviewBonafideRequest);
router.post("/bonafide-requests/bulk-review", bulkReviewBonafide);
router.get("/bonafide-requests/flagged", getFlaggedRequests);
router.post("/bonafide-requests/:id/flag", flagRequest);

// Certificate and receipt uploads
router.post("/certificates/upload", upload.single("certificate"), uploadCertificate);
router.post("/receipts/upload", upload.single("receipt"), uploadFeeReceipt);

// Certificate generation (NEW - Dynamic PDF)
router.post("/certificates/generate", generateCertificateForStudent);

module.exports = router;
