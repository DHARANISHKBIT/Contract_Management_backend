const Meeting = require("../modules/meetingModule");

exports.createMeeting = async (data) => {
  const meeting = await Meeting.create(data);
  return meeting;
};

exports.getMeetingsByContract = async (contractId) => {
  return await Meeting.find({ contract_id: contractId })
    .populate("contract_id")
    .populate("created_by");
};

exports.getMeetingById = async (id) => {
  return await Meeting.findById(id);
};

exports.deleteMeeting = async (id) => {
  return await Meeting.findByIdAndDelete(id);
};
