const Event = require("../models/Event");

const createEvent = async (req, res) => {
  try {
    if (req.user.blocked) {
      return res.status(403).json({
        message: "You are blocked and cannot create events.",
      });
    }

    if (req.user.role !== "leader") {
      return res.status(403).json({
        message: "Only leaders can create events.",
      });
    }

    const { title, content, eventDate } = req.body;

    if (!title || !content || !eventDate) {
      return res.status(400).json({
        message: "Title, content, and event date are required.",
      });
    }

    const parsedDate = new Date(eventDate);

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        message: "Event date is invalid.",
      });
    }

    const event = await Event.create({
      title: title.trim(),
      content: content.trim(),
      eventDate: parsedDate,
      user: req.user._id,
    });

    const populatedEvent = await Event.findById(event._id)
      .populate("user", "name profileImage role")
      .populate("comments.user", "name profileImage role");

    res.status(201).json({
      message: "Event created successfully",
      event: populatedEvent,
    });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({
      message: "Failed to create event",
    });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("user", "name profileImage role")
      .populate("comments.user", "name profileImage role")
      .sort({ eventDate: 1, createdAt: -1 });

    res.status(200).json({
      message: "Events fetched successfully",
      events,
    });
  } catch (error) {
    console.error("Get all events error:", error);
    res.status(500).json({
      message: "Failed to fetch events",
    });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("user", "name profileImage role")
      .populate("comments.user", "name profileImage role");

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    res.status(200).json({
      message: "Event fetched successfully",
      event,
    });
  } catch (error) {
    console.error("Get event by id error:", error);
    res.status(500).json({
      message: "Failed to fetch event",
    });
  }
};

const likeEvent = async (req, res) => {
  try {
    if (req.user.blocked) {
      return res.status(403).json({
        message: "You are blocked and cannot like events.",
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const userId = req.user._id.toString();
    const hasLiked = event.likes.some((like) => like.toString() === userId);

    if (hasLiked) {
      event.likes = event.likes.filter((like) => like.toString() !== userId);
    } else {
      event.likes.push(req.user._id);
    }

    await event.save();

    res.status(200).json({
      message: hasLiked ? "Event like removed" : "Event liked",
      liked: !hasLiked,
      likesCount: event.likes.length,
      likes: event.likes,
    });
  } catch (error) {
    console.error("Like event error:", error);
    res.status(500).json({
      message: "Failed to update like",
    });
  }
};

const addEventComment = async (req, res) => {
  try {
    if (req.user.blocked) {
      return res.status(403).json({
        message: "You are blocked and cannot comment on events.",
      });
    }

    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Comment text is required",
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const comment = {
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date(),
      likes: [],
    };

    event.comments.push(comment);
    await event.save();

    const populatedEvent = await Event.findById(event._id)
      .populate("user", "name profileImage role")
      .populate("comments.user", "name profileImage role");

    const newComment = populatedEvent.comments[populatedEvent.comments.length - 1];

    res.status(201).json({
      message: "Comment added successfully",
      comment: newComment,
      event: populatedEvent,
    });
  } catch (error) {
    console.error("Add event comment error:", error);
    res.status(500).json({
      message: "Failed to add comment",
    });
  }
};

const toggleLikeEventComment = async (req, res) => {
  try {
    if (req.user.blocked) {
      return res.status(403).json({
        message: "You are blocked and cannot like event comments.",
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const comment = event.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    const userId = req.user._id.toString();
    const hasLiked = (comment.likes || []).some((like) => like.toString() === userId);

    if (hasLiked) {
      comment.likes = (comment.likes || []).filter((like) => like.toString() !== userId);
    } else {
      comment.likes = [...(comment.likes || []), req.user._id];
    }

    await event.save();

    res.status(200).json({
      message: hasLiked ? "Comment like removed" : "Comment liked",
      liked: !hasLiked,
      likesCount: comment.likes.length,
      commentId: comment._id,
    });
  } catch (error) {
    console.error("Toggle event comment like error:", error);
    res.status(500).json({
      message: "Failed to update comment like",
    });
  }
};

const deleteEventComment = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    const comment = event.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can only delete your own comment.",
      });
    }

    event.comments = event.comments.filter(
      (item) => item._id.toString() !== req.params.commentId
    );

    await event.save();

    res.status(200).json({
      message: "Comment deleted successfully",
      commentId: req.params.commentId,
    });
  } catch (error) {
    console.error("Delete event comment error:", error);
    res.status(500).json({
      message: "Failed to delete comment",
    });
  }
};

const completeEvent = async (req, res) => {
  try {
    if (req.user.role !== "leader") {
      return res.status(403).json({
        message: "Only leaders can complete events.",
      });
    }

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found",
      });
    }

    await event.deleteOne();

    res.status(200).json({
      message: "Event completed and removed successfully",
    });
  } catch (error) {
    console.error("Complete event error:", error);
    res.status(500).json({
      message: "Failed to complete event",
    });
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  likeEvent,
  addEventComment,
  toggleLikeEventComment,
  deleteEventComment,
  completeEvent,
};
