const express = require("express");
const {
  getReceipts,
  getReceiptById,
  requestBonafide,
  getBonafideRequests,
  getBonafideRequestById,
  getNotices
} = require("../controllers/studentController");
const { requireAuth } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const { validateBonafideRequest } = require("../validators/studentValidators");

const router = express.Router();

router.use(requireAuth, requireRole(["student"]));

router.get("/receipts", getReceipts);
router.get("/receipts/:id", getReceiptById);
router.post("/bonafide-requests", validateBonafideRequest, requestBonafide);
router.get("/bonafide-requests", getBonafideRequests);
router.get("/bonafide-requests/:id", getBonafideRequestById);
router.get("/notices", getNotices);

module.exports = router;
