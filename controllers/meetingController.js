const meetingService = require("../services/meetingService");

/** POST /api/meetings/create - create meeting (created_by = logged-in user) */
const createMeeting = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "You must be logged in to create a meeting.",
      });
    }
    const meeting = await meetingService.createMeeting({
      ...req.body,
      created_by: userId,
    });
    res.status(201).json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/** GET /api/meetings - list meetings (admin: created by me; user: for assigned contracts) */
const getMeetingsList = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "You must be logged in to view meetings.",
      });
    }
    const data = await meetingService.getMeetingsForUser(userId, role);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** GET /api/meetings/contract/:contractId - meetings for one contract */
const getMeetingsByContract = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "You must be logged in to view meetings.",
      });
    }
    const data = await meetingService.getMeetingsByContract(req.params.contractId);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/** PUT /api/meetings/:id - update meeting (creator or admin only) */
const updateMeeting = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "You must be logged in to update a meeting.",
      });
    }
    const data = await meetingService.updateMeeting(
      req.params.id,
      userId,
      role,
      req.body
    );
    res.json({ success: true, data });
  } catch (error) {
    const status = error.message?.includes("not found") || error.message?.includes("Not allowed")
      ? 404
      : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

/** DELETE /api/meetings/:id - delete meeting (creator or admin only) */
const deleteMeeting = async (req, res) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "You must be logged in to delete a meeting.",
      });
    }
    await meetingService.deleteMeeting(req.params.id, userId, role);
    res.json({ success: true, message: "Meeting deleted" });
  } catch (error) {
    const status = error.message?.includes("not found") || error.message?.includes("Not allowed")
      ? 404
      : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

module.exports = {
  createMeeting,
  getMeetingsList,
  getMeetingsByContract,
  updateMeeting,
  deleteMeeting,
};
