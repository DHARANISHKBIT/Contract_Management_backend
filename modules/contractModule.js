const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema(
  {
    contract_name: {
      type: String,
      required: true,
      trim: true,
    },

    contract_type: {
      type: String,
      required: true,
      enum: [
        "Vendor Contract",
        "Client Contract",
        "Employment Contract",
        "Service Contract",
        "Other",
      ],
    },

    client_name: {
      type: String,
      required: true,
      trim: true,
    },

    start_date: {
      type: Date,
      required: true,
    },

    end_date: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["Active", "Expired", "Pending"],
      default: "Pending",
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true, id: false }
);

module.exports = mongoose.model("Contract", contractSchema);
