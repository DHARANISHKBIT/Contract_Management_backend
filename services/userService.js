const User = require("../modules/userModule");
const bcrypt = require("bcryptjs");

// REGISTER SERVICE
const registerUserService = async ({ username, email, password }) => {
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    throw new Error("Username already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = new User({
    username,
    email,
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

module.exports = {
  registerUserService,
  loginUserService,
};
