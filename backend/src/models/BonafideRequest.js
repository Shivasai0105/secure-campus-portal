const mongoose = require("mongoose");

const bonafideRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    certificateType: {
      type: String,
      enum: ["bonafide", "character", "transfer", "course_completion"],
      default: "bonafide"
    },
    certificateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Certificate"
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewedAt: {
      type: Date
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: 500
    },
    isFlagged: {
      type: Boolean,
      default: false,
      index: true
    },
    flaggedReason: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("BonafideRequest", bonafideRequestSchema);
