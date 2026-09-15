const fs = require("fs/promises");
const path = require("path");

const Post = require("../models/Post");

const createPost = async (req, res) => {
  try {
    if (req.user.blocked) {
      return res.status(403).json({
        message: "You are blocked and cannot create posts.",
      });
    }

    const { title, content, isEvent, eventDate } = req.body;
    const wantsEvent = Boolean(isEvent);

    // Make sure title and content were provided
    if (!title || !content) {
      return res.status(400).json({
        message: "Title and content are required",
      });
    }

    if (wantsEvent) {
      if (req.user.role !== "leader") {
        return res.status(403).json({
          message: "Only leaders can create events.",
        });
      }

      if (!eventDate) {
        return res.status(400).json({
          message: "Event date is required.",
        });
      }
    }

    // Get uploaded file path
    const files = (req.files || []).map(
      (file) => `/uploads/posts/${file.filename}`
    );

    const parsedEventDate = wantsEvent ? new Date(eventDate) : null;

    if (wantsEvent && Number.isNaN(parsedEventDate.getTime())) {
      return res.status(400).json({
        message: "Event date is invalid.",
      });
    }

    // Create the new post
    const post = await Post.create({
      title,
      content,
      files,
      user: req.user._id,
      isEvent: wantsEvent,
      eventDate: parsedEventDate,
    });

    res.status(201).json({
      message: "Post created successfully",
      post: {
        id: post._id,
        user: post.user,
        title: post.title,
        content: post.content,
        file: post.file,
        createdAt: post.createdAt,
      }
    });
  } catch (error) {
    console.error("Create post error:", error);

    res.status(500).json({
      message: "Failed to create post",
    });
  }
};

const getMyPosts = async (req, res) => {
  try {
    const posts = await Post.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Posts fetched successfully",
      posts,
    });
  } catch (error) {
    console.error("Get my posts error:", error);

    res.status(500).json({
      message: "Failed to fetch posts",
    });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "name profileImage role")
      .populate("comments.user", "name profileImage role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Posts fetched successfully",
      posts,
    });
  } catch (error) {
    console.error("Get all posts error:", error);

    res.status(500).json({
      message: "Failed to fetch posts",
    });
  }
};

const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", "name profileImage role")
      .populate("comments.user", "name profileImage role");

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    res.status(200).json({
      message: "Post fetched successfully",
      post,
    });
  } catch (error) {
    console.error("Get post by id error:", error);

    res.status(500).json({
      message: "Failed to fetch post",
    });
  }
};

const getSavedPosts = async (req, res) => {
  try {
    const savedPostIds = (req.user.savedPosts || []).map((postId) =>
      postId.toString()
    );

    const posts = await Post.find({
      _id: { $in: savedPostIds },
    })
      .populate("user", "name profileImage role")
      .populate("comments.user", "name profileImage role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Saved posts fetched successfully",
      posts,
    });
  } catch (error) {
    console.error("Get saved posts error:", error);

    res.status(500).json({
      message: "Failed to fetch saved posts",
    });
  }
};

const toggleSavePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const postIdString = post._id.toString();
    const isSaved = (req.user.savedPosts || []).some(
      (savedPostId) => savedPostId.toString() === postIdString
    );

    if (isSaved) {
      req.user.savedPosts = (req.user.savedPosts || []).filter(
        (savedPostId) => savedPostId.toString() !== postIdString
      );
    } else {
      req.user.savedPosts = [...(req.user.savedPosts || []), post._id];
    }

    await req.user.save();

    res.status(200).json({
      message: isSaved
        ? "Post removed from saved posts"
        : "Post saved successfully",
      saved: !isSaved,
      savedPosts: req.user.savedPosts,
    });
  } catch (error) {
    console.error("Toggle save post error:", error);

    res.status(500).json({
      message: "Failed to update saved posts",
    });
  }
};

const likePost = async (req, res) => {
  try {
    if (req.user.blocked) {
      return res.status(403).json({
        message: "You are blocked and cannot like posts.",
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const userId = req.user._id.toString();
    const hasLiked = post.likes.some(
      (like) => like.toString() === userId
    );

    if (hasLiked) {
      post.likes = post.likes.filter(
        (like) => like.toString() !== userId
      );
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();

    res.status(200).json({
      message: hasLiked ? "Like removed" : "Post liked",
      liked: !hasLiked,
      likesCount: post.likes.length,
      likes: post.likes,
    });
  } catch (error) {
    console.error("Like post error:", error);

    res.status(500).json({
      message: "Failed to update like",
    });
  }
};

const addComment = async (req, res) => {
  try {
    if (req.user.blocked) {
      return res.status(403).json({
        message: "You are blocked and cannot comment.",
      });
    }

    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Comment text is required",
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const comment = {
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date(),
      likes: [],
    };

    post.comments.push(comment);
    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate("user", "name profileImage role")
      .populate("comments.user", "name profileImage role");

    const newComment = populatedPost.comments[populatedPost.comments.length - 1];

    res.status(201).json({
      message: "Comment added successfully",
      comment: newComment,
      post: populatedPost,
    });
  } catch (error) {
    console.error("Add comment error:", error);

    res.status(500).json({
      message: "Failed to add comment",
    });
  }
};

const toggleLikeComment = async (req, res) => {
  try {
    if (req.user.blocked) {
      return res.status(403).json({
        message: "You are blocked and cannot like comments.",
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    const userId = req.user._id.toString();
    const hasLiked = (comment.likes || []).some(
      (like) => like.toString() === userId
    );

    if (hasLiked) {
      comment.likes = (comment.likes || []).filter(
        (like) => like.toString() !== userId
      );
    } else {
      comment.likes = [...(comment.likes || []), req.user._id];
    }

    await post.save();

    res.status(200).json({
      message: hasLiked ? "Comment like removed" : "Comment liked",
      liked: !hasLiked,
      likesCount: comment.likes.length,
      commentId: comment._id,
    });
  } catch (error) {
    console.error("Toggle comment like error:", error);

    res.status(500).json({
      message: "Failed to update comment like",
    });
  }
};

const deleteComment = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Only the post owner can delete comments.",
      });
    }

    const comment = post.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        message: "Comment not found",
      });
    }

    post.comments = post.comments.filter(
      (item) => item._id.toString() !== req.params.commentId
    );

    await post.save();

    res.status(200).json({
      message: "Comment deleted successfully",
      commentId: req.params.commentId,
    });
  } catch (error) {
    console.error("Delete comment error:", error);

    res.status(500).json({
      message: "Failed to delete comment",
    });
  }
};

const updatePost = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        message: "Title and content are required",
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can only edit your own posts",
      });
    }

    let keepFiles = [];

    if (req.body.existingFiles) {
      try {
        const parsedFiles = JSON.parse(req.body.existingFiles);
        keepFiles = Array.isArray(parsedFiles) ? parsedFiles : [];
      } catch (error) {
        console.error("Parse existingFiles error:", error);
      }
    }

    const newFiles = (req.files || []).map(
      (file) => `/uploads/posts/${file.filename}`
    );

    const finalFiles = [...keepFiles, ...newFiles];

    const removedFiles = (post.files || []).filter(
      (file) => !finalFiles.includes(file)
    );

    for (const file of removedFiles) {
      const absolutePath = path.join(
        __dirname,
        "..",
        "uploads",
        file.replace("/uploads/", "")
      );

      try {
        await fs.unlink(absolutePath);
      } catch (error) {
        console.error("Failed to delete file:", file, error);
      }
    }

    post.title = title;
    post.content = content;
    post.files = finalFiles;

    await post.save();

    res.status(200).json({
      message: "Post updated successfully",
      post,
    });
  } catch (error) {
    console.error("Update post error:", error);

    res.status(500).json({
      message: "Failed to update post",
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
      });
    }

    if (
      post.user.toString() !== req.user._id.toString() &&
      req.user.role !== "leader"
    ) {
      return res.status(403).json({
        message: "Only leaders or the post owner can delete this post",
      });
    }

    await post.deleteOne();

    res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete post error:", error);

    res.status(500).json({
      message: "Failed to delete post",
    });
  }
};

module.exports = {
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
};