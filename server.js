require("dotenv").config();

if (!process.env.JWT_SECRET) {
  console.warn("Warning: JWT_SECRET is not set in .env. Using default (unsafe for production).");
  process.env.JWT_SECRET = "default-dev-secret-change-in-production";
}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const userRoutes = require("./routers/userRoute");
const contractRoutes = require("./routers/contractRoutes");
const meetingRoutes = require("./routers/meetingRoutes");
const notificationRoutes = require("./routers/notificationRoutes");
const { runDailyExpiryReminders } = require("./services/notificationService");
const cron = require("node-cron");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/contractDB";

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/notifications", notificationRoutes);

let meetLink = "";

app.post("/send-meet", (req, res) => {
    meetLink = req.body.meetLink;
    res.send("Link stored");
});

app.get("/get-meet", (req, res) => {
    res.json({ meetLink });
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    // Daily at 9:00 AM: send expiry reminders for contracts expiring in 0–4 days
    cron.schedule("0 9 * * *", () => {
      runDailyExpiryReminders().catch((err) => console.error("Expiry reminders error:", err));
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});