const express = require("express");
const {
  getAllContracts,
  createContract,
  updateContract,
  deleteContract,
  getDashboard,
} = require("../controllers/contractController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/allcontract", authenticateToken, getAllContracts);
router.get("/dashboard", authenticateToken, getDashboard);
router.post("/create", authenticateToken, createContract);
router.put("/update/:id", authenticateToken, updateContract);
router.delete("/:id", authenticateToken, deleteContract);

module.exports = router;
