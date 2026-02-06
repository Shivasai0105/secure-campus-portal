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
const {
  validateStudentRegistration,
  validateFacultyRegistration,
  validateAdminRegistration,
  validateLogin
} = require("../validators/authValidators");

const router = express.Router();

// Public routes with validation
router.post("/register-student", validateStudentRegistration, registerStudent);
router.post("/register-faculty", validateFacultyRegistration, registerFaculty);
router.post("/register-admin", validateAdminRegistration, registerAdmin);
router.post("/login", validateLogin, login);

// Protected routes
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, me);
router.post("/register", requireAuth, requireRole(["admin"]), register);

module.exports = router;
