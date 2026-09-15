const User = require("../models/User");
const Post = require("../models/Post");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken")

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please provide name, email and password",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "An account with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check that fields were provided
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // 2. Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 3. Compare password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // 4. Create JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // 5. Send response
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getMe = async (req, res) => {
  try {
    res.status(200).json({
      user: req.user,
    });
  } catch (error) {
    console.error("Get user error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getAllUsersForAnalysis = async (req, res) => {
  try {
    if (req.user.role !== "leader") {
      return res.status(403).json({
        message: "Only leaders can access the analysis page.",
      });
    }

    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    const posts = await Post.find()
      .populate("user", "name profileImage role")
      .populate("comments.user", "name profileImage role")
      .sort({ createdAt: -1 });

    const usersWithPosts = users.map((user) => {
      const userPosts = posts.filter(
        (post) =>
          post.user && post.user._id.toString() === user._id.toString()
      );

      return {
        ...user.toObject(),
        posts: userPosts,
      };
    });

    res.status(200).json({
      message: "Users fetched successfully",
      users: usersWithPosts,
    });
  } catch (error) {
    console.error("Get all users for analysis error:", error);

    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
};

const updateUserRole = async (req, res) => {
  try {
    if (req.user.role !== "leader") {
      return res.status(403).json({
        message: "Only leaders can change user roles.",
      });
    }

    const { role } = req.body;

    if (!role || !["user", "leader"].includes(role)) {
      return res.status(400).json({
        message: "Role must be either user or leader.",
      });
    }

    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    targetUser.role = role;
    await targetUser.save();

    res.status(200).json({
      message: "User role updated successfully.",
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (error) {
    console.error("Update user role error:", error);

    res.status(500).json({
      message: "Failed to update user role.",
    });
  }
};

const updateUserBlockStatus = async (req, res) => {
  try {
    if (req.user.role !== "leader") {
      return res.status(403).json({
        message: "Only leaders can block or unblock users.",
      });
    }

    const { blocked } = req.body;

    if (typeof blocked !== "boolean") {
      return res.status(400).json({
        message: "Blocked status must be a boolean value.",
      });
    }

    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    targetUser.blocked = blocked;
    await targetUser.save();

    res.status(200).json({
      message: blocked
        ? "User blocked successfully."
        : "User unblocked successfully.",
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        blocked: targetUser.blocked,
      },
    });
  } catch (error) {
    console.error("Update user block status error:", error);

    res.status(500).json({
      message: "Failed to update user block status.",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  getAllUsersForAnalysis,
  updateUserRole,
  updateUserBlockStatus,
};