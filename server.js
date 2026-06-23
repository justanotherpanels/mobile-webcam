require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3002",
  process.env.ALLOWED_ORIGIN,
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

const rooms = new Map();

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

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

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
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
