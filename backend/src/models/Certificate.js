const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ["bonafide", "character", "transfer", "course_completion"],
        required: true
    },
    issueDate: {
        type: Date,
        default: Date.now
    },
    validUntil: Date,
    certificateNumber: {
        type: String,
        required: true,
        unique: true
    },
    filePath: String,
    fileUrl: String,
    issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    status: {
        type: String,
        enum: ["active", "revoked"],
        default: "active"
    }
}, { timestamps: true });

module.exports = mongoose.model("Certificate", certificateSchema);
