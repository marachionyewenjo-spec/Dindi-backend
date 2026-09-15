const User = require("../models/User");
const fs = require("fs");
const path = require("path");

const updateProfile = async (req, res) => {
  try {
    const { name, bio, location } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.name = name ?? user.name;
    user.bio = bio ?? user.bio;
    user.location = location ?? user.location;

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        location: user.location,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    res.status(500).json({
      message: "Failed to update profile",
    });
  }
};

const uploadProfileImage = async (req, res) => {
  try {
    // Make sure an image was uploaded
    if (!req.file) {
      return res.status(400).json({
        message: "Please select an image",
      });
    }

    // Find logged-in user
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // ==========================================
    // DELETE OLD PROFILE IMAGE
    // ==========================================

    if (user.profileImage) {
      const oldImagePath = path.join(
        __dirname,
        "..",
        user.profileImage
      );

      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // ==========================================
    // SAVE NEW PROFILE IMAGE
    // ==========================================

    user.profileImage = `/uploads/profile/${req.file.filename}`;

    await user.save();

    // ==========================================
    // SEND UPDATED USER
    // ==========================================

    res.status(200).json({
      message: "Profile picture updated successfully",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        location: user.location,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    console.error(
      "Upload profile image error:",
      error
    );

    res.status(500).json({
      message: "Failed to upload profile picture",
    });
  }
};

module.exports = {
  updateProfile,
  uploadProfileImage,
};