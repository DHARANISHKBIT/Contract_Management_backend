const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    contract_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      required: true
    },

    meeting_date: {
      type: Date,
      required: true
    },

    meeting_time: {
      type: String,
      required: true
    },

    location: {
      type: String,
      default: ""
    },

    description: {
      type: String,
      trim: true
    },

    attendees: [
      {
        type: String   // emails or names
      }
    ],

    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meeting", meetingSchema);
