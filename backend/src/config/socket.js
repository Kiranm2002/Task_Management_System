const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const redisClient = require("./redis"); 

let io; 

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  const pubClient = redisClient;
  const subClient = redisClient.duplicate();

  subClient.on("error", (err) => console.error("Redis Sub Error", err));
  
  io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", (socket) => {

    socket.on("join_room", (userId) => {
      if (!userId) {
        return;
    }
    const roomName = userId.toString();
    socket.join(roomName);
    });
    socket.on("JOIN_PROJECT", (projectId) => {
      socket.join(projectId);
    });

    socket.on("JOIN_ADMIN_ANALYTICS", () => {
        socket.join("admin_analytics_room");
    });

    socket.on("LEAVE_PROJECT", (projectId) => {
      socket.leave(projectId);
    });
    
    socket.on("disconnect", () => {
      console.log("User Disconnected");
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = { initSocket, getIO };