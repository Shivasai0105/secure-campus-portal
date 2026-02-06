const BonafideRequest = require("../models/BonafideRequest");
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

module.exports = {
  listPendingBonafide,
  reviewBonafide
};
