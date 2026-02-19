const express = require("express");
const {
  createMeeting,
  getMeetingsList,
  getMeetingsByContract,
  updateMeeting,
  deleteMeeting,
} = require("../controllers/meetingController");
const { authenticateToken } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/create", authenticateToken, createMeeting);
router.get("/", authenticateToken, getMeetingsList);
router.get("/contract/:contractId", authenticateToken, getMeetingsByContract);
router.put("/:id", authenticateToken, updateMeeting);
router.delete("/:id", authenticateToken, deleteMeeting);

module.exports = router;