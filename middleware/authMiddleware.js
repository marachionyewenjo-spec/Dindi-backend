const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Not authorized. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    const isDbError =
      error?.name === "MongoNetworkError" ||
      error?.message?.includes("ENOTFOUND") ||
      error?.message?.includes("ECONNREFUSED") ||
      error?.message?.includes("buffering timed out") ||
      error?.message?.includes("MongoDB") ||
      error?.message?.includes("mongodb");

    if (isDbError) {
      return res.status(503).json({
        message:
          "Database connection failed. Please try again later or check your MongoDB connection.",
      });
    }

    return res.status(401).json({
      message: "Not authorized. Invalid token.",
    });
  }
};

module.exports = protect;