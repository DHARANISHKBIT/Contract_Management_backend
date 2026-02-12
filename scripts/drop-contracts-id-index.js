/**
 * One-time script to fix E11000 duplicate key error on contracts.id_1.
 * The contracts collection has a unique index on "id" but our schema only uses _id,
 * so every document has id: null, causing duplicate key errors.
 *
 * Run from backend folder: node scripts/drop-contracts-id-index.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/contractDB";

async function dropIndex() {
  try {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const contracts = db.collection("contracts");

    const indexes = await contracts.indexes();
    const idIndex = indexes.find((idx) => idx.name === "id_1");

    if (idIndex) {
      await contracts.dropIndex("id_1");
      console.log("Dropped index 'id_1' from contracts collection. You can create contracts now.");
    } else {
      console.log("Index 'id_1' not found. Collection may already be fixed.");
    }
  } catch (err) {
    if (err.code === 27 || err.message?.includes("index not found")) {
      console.log("Index 'id_1' already missing. You're good.");
    } else {
      console.error("Error:", err.message);
      process.exit(1);
    }
  } finally {
    await mongoose.disconnect();
  }
}

dropIndex();
