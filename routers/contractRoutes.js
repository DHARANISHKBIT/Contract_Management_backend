const express = require("express");
const {
  getAllContracts,
  createContract,
  getDashboard,
} = require("../controllers/contractController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/allcontract", authenticateToken, getAllContracts);
router.get("/dashboard", authenticateToken, getDashboard);
router.post("/create", authenticateToken, createContract);

module.exports = router;
