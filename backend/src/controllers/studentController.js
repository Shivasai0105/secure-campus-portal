const FeeReceipt = require("../models/FeeReceipt");
const BonafideRequest = require("../models/BonafideRequest");
const { logAudit } = require("../utils/auditLogger");

const getReceipts = async (req, res) => {
  try {
    const receipts = await FeeReceipt.find({ studentId: req.user.id })
      .sort({ paidAt: -1 })
      .lean();

    await logAudit({
      userId: req.user.id,
      role: req.user.role,
      action: "RECEIPT_VIEW",
      ip: req.ip,
      metadata: { count: receipts.length }
    });

    return res.json({ receipts });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getReceiptById = async (req, res) => {
  try {
    const receipt = await FeeReceipt.findOne({
      _id: req.params.id,
      studentId: req.user.id
    }).lean();

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    await logAudit({
      userId: req.user.id,
      role: req.user.role,
      action: "RECEIPT_VIEW",
      ip: req.ip,
      metadata: { receiptId: receipt._id }
    });

    return res.json({ receipt });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const requestBonafide = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Reason is required" });
    }

    const request = await BonafideRequest.create({
      studentId: req.user.id,
      reason: reason.trim()
    });

    await logAudit({
      userId: req.user.id,
      role: req.user.role,
      action: "BONAFIDE_REQUEST",
      ip: req.ip,
      metadata: { requestId: request._id }
    });

    return res.status(201).json({ request });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getBonafideRequests = async (req, res) => {
  try {
    const requests = await BonafideRequest.find({ studentId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ requests });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getBonafideRequestById = async (req, res) => {
  try {
    const request = await BonafideRequest.findOne({
      _id: req.params.id,
      studentId: req.user.id
    }).lean();

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    return res.json({ request });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getReceipts,
  getReceiptById,
  requestBonafide,
  getBonafideRequests,
  getBonafideRequestById
};
