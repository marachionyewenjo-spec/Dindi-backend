require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

const connectDB = require("./config/db");

const authRouter = require("./route/authRoute");
const postRouter = require("./route/postRoute");
const eventRouter = require("./route/eventRoute");

const app = express();

// Connect to database before starting the app

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

// CORS
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use( "/uploads", express.static(path.join(__dirname, "uploads")) );

// Routes
app.use("/api/auth", authRouter);
app.use("/api/posts", postRouter);
app.use("/api/events", eventRouter);

// Request logger
app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.originalUrl);
  next();
});

// Start server
const PORT = 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;