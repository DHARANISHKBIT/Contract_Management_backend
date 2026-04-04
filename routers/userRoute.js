const express = require("express");
const {
  registerUser,
  loginUser,
  listUsers,
  updateUserRole,
  listUsersAssignedToMyContracts,
  adminCreateUser,
  adminDeleteUser,
} = require("../controllers/userController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// Admin user management (specific paths before /:id)
router.get("/assigned-to-my-contracts", authenticateToken, listUsersAssignedToMyContracts);
router.post("/admin/create", authenticateToken, adminCreateUser);
router.delete("/:id", authenticateToken, adminDeleteUser);
router.patch("/:id/role", authenticateToken, updateUserRole);
router.get("/", authenticateToken, listUsers);

module.exports = router;
