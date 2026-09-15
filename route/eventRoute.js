const express = require("express");

const protect = require("../middleware/authMiddleware");
const {
  createEvent,
  getAllEvents,
  getEventById,
  likeEvent,
  addEventComment,
  toggleLikeEventComment,
  deleteEventComment,
  completeEvent,
} = require("../controller/eventController");

const router = express.Router();

router.post("/", protect, createEvent);
router.get("/", protect, getAllEvents);
router.get("/:id", protect, getEventById);
router.post("/:id/like", protect, likeEvent);
router.post("/:id/comments", protect, addEventComment);
router.post("/:id/comments/:commentId/like", protect, toggleLikeEventComment);
router.delete("/:id/comments/:commentId", protect, deleteEventComment);
router.delete("/:id", protect, completeEvent);

module.exports = router;
