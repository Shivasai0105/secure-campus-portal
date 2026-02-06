const express = require("express");
const {
  register,
  login,
  logout,
  me,
  registerStudent,
  registerFaculty,
  registerAdmin
} = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const router = express.Router();

// Public routes
router.post("/register-student", registerStudent);
router.post("/register-faculty", registerFaculty);
router.post("/register-admin", registerAdmin);
router.post("/login", login);

// Protected routes
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);
router.post("/register", requireAuth, requireRole(["admin"]), register);

module.exports = router;
