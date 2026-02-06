const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["student", "faculty", "admin"],
      default: "student"
    },
    // Student-specific fields
    rollNumber: {
      type: String,
      sparse: true
    },
    semester: {
      type: String
    },
    // Faculty-specific fields
    employeeId: {
      type: String,
      sparse: true
    },
    designation: {
      type: String
    },
    officeNumber: {
      type: String
    },
    // Admin-specific fields
    adminLevel: {
      type: String
    },
    officeLocation: {
      type: String
    },
    // Common fields
    department: {
      type: String
    },
    phone: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
