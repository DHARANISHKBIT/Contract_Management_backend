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

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/contractDB";

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/contracts", contractRoutes);

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
