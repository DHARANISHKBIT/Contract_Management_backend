const Meeting = require("../modules/meetingModule");
const Contract = require("../modules/contractModule");
const mongoose = require("mongoose");

exports.createMeeting = async (data) => {
  const meeting = await Meeting.create(data);
  return meeting;
};

exports.getMeetingsByContract = async (contractId) => {
  return await Meeting.find({ contract_id: contractId })
    .populate("contract_id", "contract_name client_name")
    .populate("created_by", "username email")
    .sort({ meeting_date: 1, meeting_time: 1 });
};

exports.getMeetingById = async (id) => {
  return await Meeting.findById(id)
    .populate("contract_id", "contract_name client_name")
    .populate("created_by", "username email");
};

/** Get meetings for logged-in user: admin = created by user; user = meetings for contracts assigned to them */
exports.getMeetingsForUser = async (userId, role) => {
  const userIdObjectId = new mongoose.Types.ObjectId(userId);
  let query;
  if (role === "user") {
    const assignedContracts = await Contract.find({
      $or: [{ assigned_to: userIdObjectId }, { assiged_to: userIdObjectId }]
    }).select("_id");
    const contractIds = assignedContracts.map((c) => c._id);
    query = { contract_id: { $in: contractIds } };
  } else {
    query = { created_by: userIdObjectId };
  }
  return await Meeting.find(query)
    .populate("contract_id", "contract_name client_name")
    .populate("created_by", "username email")
    .sort({ meeting_date: -1, meeting_time: 1 });
};

exports.updateMeeting = async (meetingId, userId, role, updateData) => {
  const meeting = await Meeting.findById(meetingId);
  if (!meeting) throw new Error("Meeting not found");
  const isCreator = meeting.created_by.toString() === userId.toString();
  const isAdmin = role === "admin";
  if (!isCreator && !isAdmin) throw new Error("Not allowed to update this meeting");
  const updated = await Meeting.findByIdAndUpdate(
    meetingId,
    updateData,
    { new: true, runValidators: true }
  )
    .populate("contract_id", "contract_name client_name")
    .populate("created_by", "username email");
  return updated;
};

exports.deleteMeeting = async (id, userId, role) => {
  const meeting = await Meeting.findById(id);
  if (!meeting) throw new Error("Meeting not found");
  const isCreator = meeting.created_by.toString() === userId.toString();
  const isAdmin = role === "admin";
  if (!isCreator && !isAdmin) throw new Error("Not allowed to delete this meeting");
  await Meeting.findByIdAndDelete(id);
  return { deleted: true, id };
};