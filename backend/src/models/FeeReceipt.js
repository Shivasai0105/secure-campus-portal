const mongoose = require("mongoose");

const feeReceiptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    semester: {
      type: String,
      required: true,
      trim: true
    },
    paidAt: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeeReceipt", feeReceiptSchema);
