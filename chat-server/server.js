require("dotenv").config();
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 8000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "https://alles-iota.vercel.app";

if (!MONGODB_URI || !JWT_SECRET) {
  throw new Error(
    "FATAL ERROR: MONGODB_URI or JWT_SECRET is not defined in the .env file.",
  );
}

const userSchema = new mongoose.Schema({
  username: String,
  avatar: { url: String },
});
const roomSchema = new mongoose.Schema(
  {
    name: String,
    roomId: String,
    members: [mongoose.Schema.Types.ObjectId],
  },
  { collection: "rooms" },
);

const messageSchema = new mongoose.Schema(
  {
    content: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room" },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
const Room = mongoose.model("Room", roomSchema);
const Message = mongoose.model("Message", messageSchema);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CORS_ORIGIN, methods: ["GET", "POST"] },
});

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token)
    return next(new Error("Authentication error: Token not provided."));

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error("Authentication error: Invalid token."));
    socket.user = decoded;
    next();
  });
});

const userSocketMap = new Map();
const roomPresence = new Map();

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.user.username}`);

  socket.on("join room", async (roomId) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }

      socket.join(roomId);
      console.log(`${socket.user.username} joined room: ${roomId}`);

      const newMember = {
        _id: socket.user._id,
        username: socket.user.username,
        avatar: socket.user.avatar || { url: "https://via.placeholder.com/32" },
      };

      socket.to(roomId).emit("member joined", newMember);

      if (!roomPresence.has(roomId)) {
        roomPresence.set(roomId, new Map());
      }
      const roomUsers = roomPresence.get(roomId);
      roomUsers.set(socket.user._id, {
        _id: socket.user._id,
        username: socket.user.username,
      });

      const onlineUsersArray = Array.from(roomUsers.values());
      io.to(roomId).emit("update presence", onlineUsersArray);

      const messages = await Message.find({ room: room._id })
        .populate("sender", "username avatar.url")
        .sort({ createdAt: 1 })
        .limit(50);

      socket.emit("chat history", messages);
    } catch (error) {
      console.error("Join room error:", error);
      socket.emit("error", "Server error while joining room.");
    }
  });

  socket.on("room message", async ({ roomId, message }) => {
    try {
      const room = await Room.findOne({ roomId });
      if (!room) return;

      const newMessage = new Message({
        content: message,
        sender: socket.user._id,
        room: room._id,
      });
      await newMessage.save();

      const populatedMessage = await Message.findById(newMessage._id).populate(
        "sender",
        "username avatar.url",
      );

      io.to(roomId).emit("new message", populatedMessage);
    } catch (error) {
      console.error("Room message error:", error);
    }
  });

  socket.on("kick user", ({ roomId, memberId, memberUsername }) => {
    const targetSocketId = userSocketMap.get(memberId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("kicked", {
        roomId,
        message: "You have been kicked by the owner.",
      });
      io.sockets.sockets.get(targetSocketId)?.leave(roomId);
    }
    io.to(roomId).emit("user left", { username: memberUsername });
    io.to(roomId).emit("member left", { memberId });
  });

  socket.on("delete room", ({ roomId }) => {
    io.to(roomId).emit("room deleted", {
      message: "This room has been deleted by the owner.",
    });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.user.username}`);

    roomPresence.forEach((roomUsers, roomId) => {
      if (roomUsers.has(socket.user._id)) {
        roomUsers.delete(socket.user._id);

        const onlineUsersArray = Array.from(roomUsers.values());
        io.to(roomId).emit("update presence", onlineUsersArray);
      }
    });
  });
});

async function startServer() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log(" MongoDB connected successfully.");

    server.listen(PORT, () => {
      console.log(` Chat server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(" Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
