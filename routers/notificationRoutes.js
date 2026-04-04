const express = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  getMine,
  getUnreadCount,
  markOneRead,
  markAllRead,
  runExpiryReminders,
} = require("../controllers/notificationController");

const router = express.Router();

router.get("/", authenticateToken, getMine);
router.get("/unread-count", authenticateToken, getUnreadCount);
router.patch("/read-all", authenticateToken, markAllRead);
router.patch("/:id/read", authenticateToken, markOneRead);
router.post("/run-expiry-reminders", authenticateToken, runExpiryReminders);

module.exports = router;
