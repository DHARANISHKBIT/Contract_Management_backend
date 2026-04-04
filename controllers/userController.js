const jwt = require("jsonwebtoken");
const {
  registerUserService,
  loginUserService,
  listUsersService,
  updateUserRoleService,
  adminCreateUserService,
  adminDeleteUserService,
} = require("../services/userService");
const Contract = require("../modules/contractModule");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

const requireAdmin = (req) => {
  if (req.user?.role !== "admin") {
    const err = new Error("Admin access required");
    err.statusCode = 403;
    throw err;
  }
};

// REGISTER CONTROLLER
const registerUser = async (req, res) => {
  try {
    const user = await registerUserService(req.body);
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// LOGIN CONTROLLER
const loginUser = async (req, res) => {
  try {
    const user = await loginUserService(req.body);
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// ADMIN: LIST USERS
const listUsers = async (req, res) => {
  try {
    requireAdmin(req);
    const users = await listUsersService();
    res.status(200).json({
      success: true,
      data: users.map((u) => ({
        id: u._id,
        username: u.username,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};

// ADMIN: CREATE USER
const adminCreateUser = async (req, res) => {
  try {
    requireAdmin(req);
    const { username, email, password, role } = req.body || {};
    const user = await adminCreateUserService({ username, email, password, role });
    res.status(201).json({
      success: true,
      message: "User created",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};

// ADMIN: DELETE USER
const adminDeleteUser = async (req, res) => {
  try {
    requireAdmin(req);
    const adminId = req.user?.id;
    await adminDeleteUserService(req.params.id, adminId);
    res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};

// ADMIN: UPDATE USER ROLE
const updateUserRole = async (req, res) => {
  try {
    requireAdmin(req);
    const { role } = req.body || {};
    const updated = await updateUserRoleService(req.params.id, role);
    res.status(200).json({
      success: true,
      message: "Role updated",
      data: {
        id: updated._id,
        username: updated.username,
        email: updated.email,
        role: updated.role,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};

// ADMIN: LIST USERS ASSIGNED TO MY CONTRACTS (exclude me)
const listUsersAssignedToMyContracts = async (req, res) => {
  try {
    requireAdmin(req);
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ success: false, message: "User ID not found in token" });
    }

    const contracts = await Contract.find(
      { created_by: adminId, assigned_to: { $ne: null } },
      { assigned_to: 1 }
    )
      .populate("assigned_to", "username email role createdAt updatedAt")
      .lean();

    const byId = new Map();
    for (const c of contracts) {
      const u = c.assigned_to;
      if (!u?._id) continue;
      const id = String(u._id);
      if (id === String(adminId)) continue;
      if (!byId.has(id)) {
        byId.set(id, {
          id,
          username: u.username,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        });
      }
    }

    res.status(200).json({ success: true, data: Array.from(byId.values()) });
  } catch (error) {
    res.status(error.statusCode || 400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  listUsers,
  updateUserRole,
  listUsersAssignedToMyContracts,
  adminCreateUser,
  adminDeleteUser,
};
