const bcrypt = require("bcryptjs");
const Notice = require("../models/Notice");
const AuditLog = require("../models/AuditLog");
const User = require("../models/User");
const BonafideRequest = require("../models/BonafideRequest");
const Certificate = require("../models/Certificate");
const FeeReceipt = require("../models/FeeReceipt");
const { logAudit } = require("../utils/auditLogger");
const { generateCertificate } = require("../utils/certificateGenerator");
const path = require("path");
const mongoose = require("mongoose");

const createNotice = async (req, res) => {
  try {
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: "Title and body are required" });
    }

    const notice = await Notice.create({
      title: title.trim(),
      body: body.trim(),
      createdBy: req.user.id
    });

    await logAudit({
      userId: req.user.id,
      role: req.user.role,
      action: "NOTICE_CREATE",
      ip: req.ip,
      metadata: { noticeId: notice._id }
    });

    return res.status(201).json({ notice });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const skip = parseInt(req.query.skip, 10) || 0;

    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.json({ logs, limit, skip });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const listUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("name email role createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ users });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["student", "faculty", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const createdUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: passwordHash,
      role
    });

    await logAudit({
      userId: req.user.id,
      role: req.user.role,
      action: "USER_CREATE",
      ip: req.ip,
      metadata: { createdUserId: createdUser._id, role }
    });

    return res.status(201).json({
      user: {
        id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Bonafide Request Management
const getPendingBonafideRequests = async (req, res) => {
  try {
    const requests = await BonafideRequest.find({ status: "pending" })
      .populate("studentId", "name email")
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ requests });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const reviewBonafideRequest = async (req, res) => {
  try {
    const { action } = req.body;

    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const request = await BonafideRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already reviewed" });
    }

    request.status = action === "approve" ? "approved" : "rejected";
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();

    // Auto-generate certificate if approved
    if (action === "approve") {
      try {
        // Fetch student data
        const student = await User.findById(request.studentId);

        if (student) {
          // Generate certificate number
          const certNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

          // Prepare certificate data
          const certificateData = {
            type: request.certificateType || 'bonafide',
            certificateNumber: certNumber,
            issueDate: new Date(),
            purpose: request.reason,
            academicYear: new Date().getFullYear(),
            course: 'the program'
          };

          // Generate PDF
          const filePath = await generateCertificate(
            {
              name: student.name,
              rollNumber: student.rollNumber || student.email,
              email: student.email
            },
            certificateData
          );

          const filename = path.basename(filePath);

          // Save certificate to database
          const certificate = await Certificate.create({
            studentId: request.studentId,
            type: request.certificateType || 'bonafide',
            certificateNumber: certNumber,
            issueDate: certificateData.issueDate,
            filePath,
            fileUrl: `/uploads/certificates/${filename}`,
            issuedBy: req.user.id,
            status: 'active'
          });

          // Link certificate to request
          request.certificateId = certificate._id;
        }
      } catch (certError) {
        console.error('Certificate generation error:', certError);
        // Continue with approval even if certificate generation fails
      }
    }

    await request.save();

    await logAudit({
      userId: req.user.id,
      role: req.user.role,
      action: action === "approve" ? "BONAFIDE_APPROVE" : "BONAFIDE_REJECT",
      ip: req.ip,
      metadata: { requestId: request._id }
    });

    return res.json({ request });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const bulkReviewBonafide = async (req, res) => {
  try {
    const { requestIds, action, remarks } = req.body;

    if (!requestIds || !Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({ message: "Request IDs array is required" });
    }

    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const status = action === "approve" ? "approved" : "rejected";

    const result = await BonafideRequest.updateMany(
      { _id: { $in: requestIds }, status: "pending" },
      {
        $set: {
          status: status,
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
          remarks: remarks ? remarks.trim() : undefined
        }
      }
    );

    await logAudit({
      userId: req.user.id,
      role: req.user.role,
      action: status === "approved" ? "BONAFIDE_BULK_APPROVE" : "BONAFIDE_BULK_REJECT",
      ip: req.ip,
      metadata: { requestIds, count: result.modifiedCount }
    });

    return res.json({
      message: `${result.modifiedCount} request(s) ${status}`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getFlaggedRequests = async (req, res) => {
  try {
    const requests = await BonafideRequest.find({ isFlagged: true })
      .populate("studentId", "name email")
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ requests });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const flagRequest = async (req, res) => {
  try {
    const { reason } = req.body;

    const request = await BonafideRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.isFlagged = !request.isFlagged;
    request.flaggedReason = request.isFlagged && reason ? reason.trim() : undefined;

    await request.save();

    await logAudit({
      userId: req.user.id,
      role: req.user.role,
      action: request.isFlagged ? "BONAFIDE_FLAG" : "BONAFIDE_UNFLAG",
      ip: req.ip,
      metadata: { requestId: request._id }
    });

    return res.json({ request });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Certificate and Receipt Upload
const uploadCertificate = async (req, res) => {
  try {
    const { studentId, type, certificateNumber, validUntil } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "PDF or JPG file is required" });
    }

    const certificate = await Certificate.create({
      studentId,
      type,
      certificateNumber,
      validUntil,
      filePath: req.file.path,
      fileUrl: `/uploads/certificates/${req.file.filename}`,
      issuedBy: req.user.id
    });

    await logAudit({
      userId: req.user.id,
      role: req.user.role,
      action: "CERTIFICATE_UPLOAD",
      ip: req.ip,
      metadata: { certificateId: certificate._id, studentId }
    });

    return res.status(201).json({ certificate });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const uploadFeeReceipt = async (req, res) => {
  try {
    const {
      studentId, receiptNumber, academicYear, semester,
      amount, paymentDate, paymentMode, transactionId, feeType
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "PDF or JPG file is required" });
    }

    const receipt = await FeeReceipt.create({
      studentId,
      receiptNumber,
      academicYear,
      semester,
      amount,
      paymentDate,
      paidAt: paymentDate,
      paymentMode,
      transactionId,
      feeType,
      filePath: req.file.path,
      fileUrl: `/uploads/receipts/${req.file.filename}`,
      uploadedBy: req.user.id
    });

    await logAudit({
      userId: req.user.id,
      role: req.user.role,
      action: "RECEIPT_UPLOAD",
      ip: req.ip,
      metadata: { receiptId: receipt._id, studentId }
    });

    return res.status(201).json({ receipt });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Generate Certificate (NEW - Dynamic PDF Generation)
const generateCertificateForStudent = async (req, res) => {
  try {
    const { studentId, type, certificateNumber, purpose, academicYear, course } = req.body;

    // Validate required fields
    if (!studentId || !type || !certificateNumber) {
      return res.status(400).json({ message: "Student ID, type, and certificate number are required" });
    }

    // Find student by ObjectId, rollNumber, or email
    let student;

    if (mongoose.Types.ObjectId.isValid(studentId)) {
      // Try finding by ObjectId first
      student = await User.findById(studentId);
    }

    if (!student) {
      // Try finding by roll number or email
      student = await User.findOne({
        $or: [
          { rollNumber: studentId },
          { email: studentId }
        ],
        role: 'student'
      });
    }

    if (!student) {
      return res.status(404).json({ message: "Student not found. Please use roll number, email, or student ID." });
    }

    // Prepare certificate data
    const certificateData = {
      type,
      certificateNumber,
      issueDate: new Date(),
      purpose: purpose || '',
      academicYear: academicYear || new Date().getFullYear(),
      course: course || 'the program'
    };

    // Generate PDF
    const filePath = await generateCertificate(
      {
        name: student.name,
        rollNumber: student.rollNumber || student.email,
        email: student.email
      },
      certificateData
    );

    const filename = path.basename(filePath);

    // Save to database
    const certificate = await Certificate.create({
      studentId,
      type,
      certificateNumber,
      issueDate: certificateData.issueDate,
      filePath,
      fileUrl: `/uploads/certificates/${filename}`,
      issuedBy: req.user.id,
      status: 'active'
    });

    await logAudit({
      userId: req.user.id,
      role: req.user.role,
      action: "CERTIFICATE_GENERATED",
      ip: req.ip,
      metadata: { certificateId: certificate._id, studentId, type }
    });

    return res.status(201).json({
      message: "Certificate generated successfully",
      certificate
    });
  } catch (error) {
    console.error('Certificate generation error:', error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  createNotice,
  getAuditLogs,
  listUsers,
  createUser,
  getPendingBonafideRequests,
  reviewBonafideRequest,
  bulkReviewBonafide,
  getFlaggedRequests,
  flagRequest,
  uploadCertificate,
  uploadFeeReceipt,
  generateCertificateForStudent
};
