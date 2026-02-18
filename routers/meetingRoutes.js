const express = require("express");
const {
  createMeeting,
  getMeetingsByContract,
    deleteMeeting,
} = require("../controllers/meetingController");
const { authenticateToken } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/create", authenticateToken, createMeeting);
router.get("/contract/:contractId", authenticateToken, getMeetingsByContract);
router.delete("/:id", authenticateToken, deleteMeeting);