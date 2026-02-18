const meetingService = require("../services/meetingService");

exports.addMeeting = async (req, res) => {
  try {
    const meeting = await meetingService.createMeeting({
      ...req.body,
      created_by: req.user.id // assuming auth middleware
    });

    res.status(201).json({
      success: true,
      data: meeting
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


exports.getMeetings = async (req, res) => {
  try {
    const data = await meetingService.getMeetingsByContract(
      req.params.contractId
    );

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.deleteMeeting = async (req, res) => {
  try {
    await meetingService.deleteMeeting(req.params.id);
    res.json({ success: true, message: "Meeting deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
