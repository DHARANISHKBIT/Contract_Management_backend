const Meeting = require("../modules/meetingModule");
const Contract = require("../modules/contractModule");
const mongoose = require("mongoose");

function escapeTimeParts(meetingTime) {
  const [h, m] = String(meetingTime || "").split(":");
  const hh = Number(h);
  const mm = Number(m);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return { hh, mm };
}

// Matches the logic you shared (but using lowercase statuses to match DB enum):
// now < start => scheduled
// start <= now <= end => ongoing
// now > end => completed
function computeStatus(meeting, now = new Date()) {
  if (!meeting?.meeting_date || !meeting?.meeting_time) return meeting?.status || "scheduled";

  const tp = escapeTimeParts(meeting.meeting_time);
  if (!tp) return meeting?.status || "scheduled";

  const start = new Date(meeting.meeting_date);
  start.setHours(tp.hh, tp.mm, 0, 0);

  const durationMin = Number(meeting.duration) > 0 ? Number(meeting.duration) : 60; // default 1 hour
  const end = new Date(start.getTime() + durationMin * 60000);

  if (now < start) return "scheduled";
  if (now <= end) return "ongoing";
  return "completed";
}

async function syncStatuses(meetings) {
  const now = new Date();
  await Promise.all(
    meetings.map(async (m) => {
      const desired = computeStatus(m, now);
      if (desired && m.status !== desired) {
        m.status = desired;
        await Meeting.updateOne({ _id: m._id }, { $set: { status: desired } });
      }
    })
  );
}

exports.createMeeting = async (data) => {
  const meeting = await Meeting.create(data);
  return meeting;
};

exports.getMeetingsByContract = async (contractId) => {
  const meetings = await Meeting.find({ contract_id: contractId })
    .populate("contract_id", "contract_name client_name")
    .populate("created_by", "username email")
    .sort({ meeting_date: 1, meeting_time: 1 });

  await syncStatuses(meetings);
  return meetings;
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
  const meetings = await Meeting.find(query)
    .populate("contract_id", "contract_name client_name")
    .populate("created_by", "username email")
    .sort({ meeting_date: -1, meeting_time: 1 });

  await syncStatuses(meetings);
  return meetings;
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