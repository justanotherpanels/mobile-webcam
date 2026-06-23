require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

// Health check endpoint — Railway pings this to confirm the app is alive
app.get("/", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

const server = http.createServer(app);

// Socket.IO with explicit WebSocket + polling support
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
  allowUpgrades: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  allowEIO3: true,
});

// Debug log
console.log("Server starting...");
console.log("Allowed Origin:", process.env.ALLOWED_ORIGIN || "All origins allowed");

const rooms = new Map();

const { spawn } = require("child_process");
const ffmpegProcesses = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }
    rooms.get(roomId).add(socket.id);

    socket.to(roomId).emit("user-joined", socket.id);

    const usersInRoom = Array.from(rooms.get(roomId)).filter((id) => id !== socket.id);
    usersInRoom.forEach((userId) => {
      socket.emit("user-joined", userId);
    });
  });

  socket.on("offer", ({ targetId, offer }) => {
    socket.to(targetId).emit("offer", { offer, fromId: socket.id });
  });

  socket.on("answer", ({ targetId, answer }) => {
    socket.to(targetId).emit("answer", { answer, fromId: socket.id });
  });

  socket.on("ice-candidate", ({ targetId, candidate }) => {
    socket.to(targetId).emit("ice-candidate", { candidate, fromId: socket.id });
  });

  // RTMP Streaming Event Listeners
  socket.on("start-rtmp", ({ rtmpUrl }) => {
    console.log(`Starting RTMP stream for ${socket.id} to ${rtmpUrl}`);
    
    // Ensure no existing process
    if (ffmpegProcesses.has(socket.id)) {
      const existingProcess = ffmpegProcesses.get(socket.id);
      existingProcess.kill("SIGINT");
      ffmpegProcesses.delete(socket.id);
    }

    const ffmpegArgs = [
      '-i', '-', // Input from stdin
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-tune', 'zerolatency',
      '-b:v', '3000k',
      '-maxrate', '3000k',
      '-bufsize', '6000k',
      '-pix_fmt', 'yuv420p',
      '-g', '50', // GOP size
      '-c:a', 'aac',
      '-b:a', '160k',
      '-ar', '44100',
      '-f', 'flv',
      rtmpUrl
    ];

    const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

    ffmpegProcess.stderr.on('data', (data) => {
      // Optional: log ffmpeg stderr, but it can be noisy
      // console.log(`FFmpeg [${socket.id}]: ${data}`);
    });

    ffmpegProcess.on('close', (code) => {
      console.log(`FFmpeg process for ${socket.id} exited with code ${code}`);
      ffmpegProcesses.delete(socket.id);
      socket.emit("rtmp-stopped");
    });

    ffmpegProcess.on('error', (err) => {
      console.error(`FFmpeg error [${socket.id}]: ${err}`);
      socket.emit("rtmp-error", "Failed to start RTMP stream. Ensure FFmpeg is installed.");
    });

    ffmpegProcesses.set(socket.id, ffmpegProcess);
    socket.emit("rtmp-started");
  });

  socket.on("stream-chunk", (chunk) => {
    const ffmpegProcess = ffmpegProcesses.get(socket.id);
    if (ffmpegProcess && ffmpegProcess.stdin.writable) {
      ffmpegProcess.stdin.write(chunk);
    }
  });

  socket.on("stop-rtmp", () => {
    const ffmpegProcess = ffmpegProcesses.get(socket.id);
    if (ffmpegProcess) {
      ffmpegProcess.stdin.end();
      ffmpegProcess.kill("SIGINT");
      ffmpegProcesses.delete(socket.id);
      console.log(`Stopped RTMP stream for ${socket.id}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Stop and cleanup FFmpeg process if active
    const ffmpegProcess = ffmpegProcesses.get(socket.id);
    if (ffmpegProcess) {
      ffmpegProcess.stdin.end();
      ffmpegProcess.kill("SIGINT");
      ffmpegProcesses.delete(socket.id);
    }

    rooms.forEach((users, roomId) => {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        socket.to(roomId).emit("user-left", socket.id);
        if (users.size === 0) {
          rooms.delete(roomId);
        }
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Signaling server running on port ${PORT}`);
});
