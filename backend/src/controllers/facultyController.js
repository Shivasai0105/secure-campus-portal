const BonafideRequest = require("../models/BonafideRequest");
const Notice = require("../models/Notice");
const { logAudit } = require("../utils/auditLogger");

const listPendingBonafide = async (req, res) => {
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

const reviewBonafide = async (req, res) => {
  try {
    const { action, remarks } = req.body;

    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const status = action === "approve" ? "approved" : "rejected";

    const request = await BonafideRequest.findOne({
      _id: req.params.id,
      status: "pending"
    });

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = status;
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    request.remarks = remarks ? remarks.trim() : undefined;

    await request.save();

    await logAudit({
      userId: req.user.id,
      role: req.user.role,
      action: status === "approved" ? "BONAFIDE_APPROVE" : "BONAFIDE_REJECT",
      ip: req.ip,
      metadata: { requestId: request._id }
    });

    return res.json({ request });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

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

module.exports = {
  listPendingBonafide,
  reviewBonafide,
  createNotice,
  bulkReviewBonafide,
  getFlaggedRequests,
  flagRequest
};
