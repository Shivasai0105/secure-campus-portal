const express = require("express");
const {
  listPendingBonafide,
  reviewBonafide,
  createNotice,
  bulkReviewBonafide,
  getFlaggedRequests,
  flagRequest
} = require("../controllers/facultyController");
const { requireAuth } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(requireAuth, requireRole(["faculty"]));

// Notice routes
router.post("/notices", createNotice);

// Bonafide request routes
router.get("/bonafide-requests", listPendingBonafide);
router.post("/bonafide-requests/:id/review", reviewBonafide);
router.post("/bonafide-requests/bulk-review", bulkReviewBonafide);
router.get("/bonafide-requests/flagged", getFlaggedRequests);
router.post("/bonafide-requests/:id/flag", flagRequest);


module.exports = router;
