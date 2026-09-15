const express = require("express");

const protect = require("../middleware/authMiddleware");
const {
  createPost,
  getMyPosts,
  getAllPosts,
  getPostById,
  getSavedPosts,
  toggleSavePost,
  likePost,
  addComment,
  toggleLikeComment,
  deleteComment,
  updatePost,
  deletePost,
} = require("../controller/postController");
const { postUpload } = require("../middleware/upload");

const router = express.Router();

router.post(
  "/createPost",
  protect,
  postUpload.array("postImages", 10),
  createPost
);
router.get("/all", protect, getAllPosts);
router.get("/myPosts", protect, getMyPosts);
router.get("/saved", protect, getSavedPosts);
router.get("/:id", protect, getPostById);
router.post("/:id/save", protect, toggleSavePost);
router.post("/:id/like", protect, likePost);
router.post("/:id/comments", protect, addComment);
router.post("/:id/comments/:commentId/like", protect, toggleLikeComment);
router.delete("/:id/comments/:commentId", protect, deleteComment);
router.put(
  "/:id",
  protect,
  postUpload.array("postImages", 10),
  updatePost
);
router.delete("/:id", protect, deletePost);

module.exports = router;