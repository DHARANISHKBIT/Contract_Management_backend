const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      default: null,
    },
    type: {
      type: String,
      required: true,
      enum: ["contract_created", "expiry_reminder"],
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    // For expiry_reminder: which calendar day this notification was sent (avoid duplicates per day)
    notificationDate: { type: Date, default: null },
  },
  { timestamps: true }
);

// One expiry reminder per user per contract per day
notificationSchema.index(
  { userId: 1, contractId: 1, type: 1, notificationDate: 1 },
  { unique: true, partialFilterExpression: { type: "expiry_reminder" } }
);

module.exports = mongoose.model("Notification", notificationSchema);
