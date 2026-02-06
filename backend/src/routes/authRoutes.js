const express = require("express");
const {
  register,
  login,
  logout,
  me
} = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/login", login);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);
router.post("/register", requireAuth, requireRole(["admin"]), register);

module.exports = router;
