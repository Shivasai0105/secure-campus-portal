const express = require("express");
const {
  listPendingBonafide,
  reviewBonafide
} = require("../controllers/facultyController");
const { requireAuth } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(requireAuth, requireRole(["faculty"]));

router.get("/bonafide-requests", listPendingBonafide);
router.post("/bonafide-requests/:id/review", reviewBonafide);

module.exports = router;
