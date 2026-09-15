const express = require("express");

const {
  registerUser,
  loginUser,
  getMe,
  getAllUsersForAnalysis,
  updateUserRole,
  updateUserBlockStatus,
} = require("../controller/authController");
const protect = require("../middleware/authMiddleware");
const { updateProfile, uploadProfileImage } = require("../controller/profileController");
const { upload } = require("../middleware/upload");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.get("/users", protect, getAllUsersForAnalysis);
router.put("/users/:id/role", protect, updateUserRole);
router.put("/users/:id/block", protect, updateUserBlockStatus);
router.put("/profile", protect, updateProfile);
router.put(
  "/profile-image",
  // (req, res, next) => {
  //   console.log("✅ STEP 1: Route reached");
  //   next();
  // },
  protect,
  // (req, res, next) => {
  //   console.log("✅ STEP 2: Protect passed");
  //   next();
  // },
  upload.single("profileImage"),
  // (req, res, next) => {
  //   console.log("✅ STEP 3: Multer passed");
  //   console.log("FILE:", req.file);
  //   next();
  // },
  uploadProfileImage
);
module.exports = router;