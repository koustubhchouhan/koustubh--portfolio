const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const multer = require("multer"); // Import multer
const path = require("path"); // Import path module

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configure Multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Files will be stored in 'public/uploads/'
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    // Use the original file name with a timestamp to avoid conflicts
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// Serve static files from the 'public' directory, including the 'uploads' sub-directory
app.use(express.static("public"));

// NEW: Handle video file uploads
app.post("/upload-video", upload.single("videoFile"), (req, res) => {
  if (req.file) {
    const videoURL = `/uploads/${req.file.filename}`;
    console.log(`Video uploaded to server: ${videoURL}`);
    // Emit the URL to all connected clients (including the uploader)
    io.emit("video-share", videoURL);
    res.json({ success: true, videoURL: videoURL });
  } else {
    res
      .status(400)
      .json({ success: false, message: "No video file uploaded." });
  }
});

// Listen for new Socket.IO connections
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Note: The "video-share" event is now emitted by the server after upload,
  // not directly by the client when dragging/dropping.
  // We keep the old video-share listener in client-side for backward compatibility
  // with older clients or if you want to support both methods for some reason,
  // but the primary sharing will be via the new /upload-video endpoint.

  // Handle video play event
  socket.on("video-play", (time) => {
    console.log(`Video played by ${socket.id} at ${time}`);
    socket.broadcast.emit("video-play", time);
  });

  // Handle video pause event
  socket.on("video-pause", (time) => {
    console.log(`Video paused by ${socket.id} at ${time}`);
    socket.broadcast.emit("video-pause", time);
  });

  // Handle video seek event
  socket.on("video-seek", (time) => {
    console.log(`Video seeked by ${socket.id} to ${time}`);
    socket.broadcast.emit("video-seek", time);
  });

  // Handle video buffering event
  socket.on("video-buffering", (state) => {
    console.log(`Video buffering state for ${socket.id}: ${state}`);
    socket.broadcast.emit("video-buffering", state);
  });

  // --- WebRTC Signaling Events ---
  socket.on("offer", (description) => {
    console.log(`Received WebRTC offer from ${socket.id}`);
    socket.broadcast.emit("offer", description);
  });

  socket.on("answer", (description) => {
    console.log(`Received WebRTC answer from ${socket.id}`);
    socket.broadcast.emit("answer", description);
  });

  socket.on("ice-candidate", (candidate) => {
    console.log(`Received ICE candidate from ${socket.id}`);
    socket.broadcast.emit("ice-candidate", candidate);
  });

  // Handle client disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// Start the HTTP server on port 3000
server.listen(3000, () => {
  console.log("Server running on port 3000");
});
