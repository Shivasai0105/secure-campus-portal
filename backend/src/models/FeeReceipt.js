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
    academicYear: {
      type: String,
      required: true
    },
    paymentDate: {
      type: Date,
      required: true
    },
    paymentMode: {
      type: String,
      enum: ["cash", "online", "cheque", "dd"],
      default: "online"
    },
    transactionId: String,
    feeType: {
      type: String,
      enum: ["tuition", "exam", "library", "hostel", "other"],
      default: "tuition"
    },
    filePath: String,
    fileUrl: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    paidAt: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeeReceipt", feeReceiptSchema);
