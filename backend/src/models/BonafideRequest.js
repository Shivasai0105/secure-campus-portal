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
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("BonafideRequest", bonafideRequestSchema);
