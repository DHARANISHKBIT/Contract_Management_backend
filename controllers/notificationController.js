const notificationService = require("../services/notificationService");

function requireAdmin(req) {
  if (req.user?.role !== "admin") {
    const err = new Error("Admin only");
    err.statusCode = 403;
    throw err;
  }
}

async function getMine(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    const list = await notificationService.getForUser(userId, {
      limit: req.query.limit,
      skip: req.query.skip,
    });
    res.status(200).json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function getUnreadCount(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    const count = await notificationService.getUnreadCount(userId);
    res.status(200).json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function markOneRead(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    const updated = await notificationService.markRead(req.params.id, userId);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function markAllRead(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    await notificationService.markAllRead(userId);
    res.status(200).json({ success: true, message: "All marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

async function runExpiryReminders(req, res) {
  try {
    requireAdmin(req);
    await notificationService.runDailyExpiryReminders();
    res.status(200).json({ success: true, message: "Expiry reminders run completed." });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getMine,
  getUnreadCount,
  markOneRead,
  markAllRead,
  runExpiryReminders,
};
