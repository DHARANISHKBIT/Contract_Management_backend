const User = require("../modules/userModule");
const bcrypt = require("bcryptjs");

// REGISTER SERVICE
const registerUserService = async ({ username, email, password, role }) => {
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    throw new Error("Username already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Only allow defined roles (more can be added to schema if needed)
  const allowedRoles = new Set(["admin", "user"]);
  const normalizedRole = allowedRoles.has(role) ? role : "user";

  const user = new User({
    username,
    email,
    role: normalizedRole,
    password: hashedPassword,
  });

  return await user.save();
};

// LOGIN SERVICE
const loginUserService = async ({ username, password }) => {
  const user = await User.findOne({ username });
  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  return user;
};

// ADMIN: LIST USERS SERVICE
const listUsersService = async () => {
  return await User.find({}, { password: 0 }).sort({ createdAt: -1 });
};

// ADMIN: CREATE USER (same rules as register, no token returned)
const adminCreateUserService = async ({ username, email, password, role }) => {
  const uTrim = String(username || "").trim();
  const eNorm = String(email || "").toLowerCase().trim();
  if (!uTrim) throw new Error("Username is required");
  if (!eNorm) throw new Error("Email is required");
  if (!password || String(password).length < 6) throw new Error("Password must be at least 6 characters");

  const existingUsername = await User.findOne({ username: uTrim });
  if (existingUsername) throw new Error("Username already exists");

  const existingEmail = await User.findOne({ email: eNorm });
  if (existingEmail) throw new Error("Email already exists");

  const hashedPassword = await bcrypt.hash(String(password), 10);
  const allowedRoles = new Set(["admin", "user"]);
  const normalizedRole = allowedRoles.has(role) ? role : "user";

  const user = new User({
    username: uTrim,
    email: eNorm,
    role: normalizedRole,
    password: hashedPassword,
  });
  return await user.save();
};

// ADMIN: DELETE USER (cannot delete self)
const adminDeleteUserService = async (userIdToDelete, adminId) => {
  if (!userIdToDelete) throw new Error("User ID is required");
  if (String(userIdToDelete) === String(adminId)) {
    throw new Error("You cannot delete your own account");
  }
  const deleted = await User.findByIdAndDelete(userIdToDelete);
  if (!deleted) throw new Error("User not found");
  return deleted;
};

// ADMIN: UPDATE USER ROLE SERVICE
const updateUserRoleService = async (userId, role) => {
  const allowed = new Set(["admin", "user"]);
  if (!allowed.has(role)) {
    throw new Error("Invalid role");
  }
  const updated = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true, runValidators: true, projection: { password: 0 } }
  );
  if (!updated) {
    throw new Error("User not found");
  }
  return updated;
};

module.exports = {
  registerUserService,
  loginUserService,
  listUsersService,
  updateUserRoleService,
  adminCreateUserService,
  adminDeleteUserService,
};
