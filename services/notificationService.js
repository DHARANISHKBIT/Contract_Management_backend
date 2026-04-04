const Notification = require("../modules/notificationModule");
const Contract = require("../modules/contractModule");
const mongoose = require("mongoose");

/**
 * Notify the assigned user when a contract is created.
 */
async function createContractCreatedNotification(contract) {
  if (!contract.assigned_to) return;
  const assignedId = contract.assigned_to._id || contract.assigned_to;
  const contractName = contract.contract_name || "Contract";
  await Notification.create({
    userId: assignedId,
    contractId: contract._id,
    type: "contract_created",
    title: "New contract assigned",
    message: `You have been assigned to the contract "${contractName}".`,
  });
}

/**
 * Run daily: find contracts expiring in 0–4 days and create one notification per user (creator + assigned) per day.
 */
async function runDailyExpiryReminders() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fourDaysLater = new Date(today);
  fourDaysLater.setDate(fourDaysLater.getDate() + 4);
  fourDaysLater.setHours(23, 59, 59, 999);

  const contracts = await Contract.find({
    end_date: { $gte: today, $lte: fourDaysLater },
  })
    .populate("created_by", "_id")
    .populate("assigned_to", "_id")
    .lean();

  const notificationDate = new Date(today);
  notificationDate.setHours(12, 0, 0, 0);

  const dayStart = new Date(today);
  dayStart.setHours(12, 0, 0, 0);

  for (const c of contracts) {
    const contractName = c.contract_name || "Contract";
    const endDate = new Date(c.end_date);
    endDate.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((endDate - today) / (24 * 60 * 60 * 1000));
    const title =
      daysLeft === 0
        ? "Contract expired today"
        : `Contract expiring in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
    const message =
      daysLeft === 0
        ? `"${contractName}" has expired today.`
        : `"${contractName}" will expire in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`;

    const recipients = new Set();
    if (c.created_by?._id) recipients.add(String(c.created_by._id));
    if (c.assigned_to?._id) recipients.add(String(c.assigned_to._id));

    for (const uid of recipients) {
      const exists = await Notification.findOne({
        userId: uid,
        contractId: c._id,
        type: "expiry_reminder",
        notificationDate: dayStart,
      });
      if (exists) continue;
      try {
        await Notification.create({
          userId: uid,
          contractId: c._id,
          type: "expiry_reminder",
          title,
          message,
          notificationDate: dayStart,
        });
      } catch (err) {
        if (err.code !== 11000) console.error("Expiry notification error:", err);
      }
    }
  }
}

function getForUser(userId, options = {}) {
  const limit = Math.min(Number(options.limit) || 50, 100);
  const skip = Number(options.skip) || 0;
  return Notification.find({ userId: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("contractId", "contract_name end_date status")
    .lean();
}

async function getUnreadCount(userId) {
  return Notification.countDocuments({
    userId: new mongoose.Types.ObjectId(userId),
    read: false,
  });
}

function markRead(notificationId, userId) {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId: new mongoose.Types.ObjectId(userId) },
    { read: true },
    { new: true }
  );
}

function markAllRead(userId) {
  return Notification.updateMany(
    { userId: new mongoose.Types.ObjectId(userId) },
    { read: true }
  );
}

module.exports = {
  createContractCreatedNotification,
  runDailyExpiryReminders,
  getForUser,
  getUnreadCount,
  markRead,
  markAllRead,
};
