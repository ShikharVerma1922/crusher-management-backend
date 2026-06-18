// src/server.js
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import app from "./app.js";
import { env } from "./config/env.js";

dotenv.config();

const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`Device connected to sockets: ${socket.id}`);

  socket.on("join-room", (roomName) => {
    socket.join(roomName);
    console.log(`Device ${socket.id} joined printing room: ${roomName}`);
  });

  socket.on("disconnect", () => {
    console.log(`Device disconnected from sockets: ${socket.id}`);
  });
});

export { io };

const PORT = env.PORT || 3000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Industrial Cloud Engine running on port ${PORT}`);
});

// // src/server.js
// import express from "express";
// import { createServer } from "http";
// import { Server } from "socket.io";
// import cors from "cors";
// import { env } from "./config/env.js";

// const app = express();
// const httpServer = createServer(app);

// // Initialize Socket.io with CORS allowances
// const io = new Server(httpServer, {
//   cors: {
//     origin: env.CORS_ORIGIN,
//     methods: ["GET", "POST"],
//   },
// });

// // Middlewares
// app.use(cors());
// app.use(express.json());
// app.use(cookieParser());

// // Socket.io Connection Logic
// io.on("connection", (socket) => {
//   console.log(`Device connected: ${socket.id}`);

//   // When the local print agent boots up, it joins a specific room
//   socket.on("join-room", (roomName) => {
//     socket.join(roomName);
//     console.log(`Device ${socket.id} joined room: ${roomName}`);
//   });

//   socket.on("disconnect", () => {
//     console.log(`Device disconnected: ${socket.id}`);
//   });
// });

// export { io };

// httpServer.listen(env.PORT || 3000, () => {
//   console.log(`Cloud Server running on port ${env.PORT || 3000}`);
// });
