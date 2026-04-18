// const { Server } = require("socket.io");
// const { createAdapter } = require("@socket.io/redis-adapter");
// const redisClient = require("./redis"); 

// const initSocket = (server) => {
//   const io = new Server(server, {
//     cors: {
//       origin: ["https://task-management-system-lilac-six.vercel.app","http://localhost:5173"],
//       credentials: true
//     }
//   });

//   const pubClient = redisClient;
//   const subClient = redisClient.duplicate();
//   io.adapter(createAdapter(pubClient, subClient));

//   io.on("connection", (socket) => {
//     console.log("User connected:", socket.id);
//   });

//   return io;
// };

// module.exports = { initSocket };

let io; 

const initSocket = (server) => {
  const { Server } = require("socket.io");
  const { createAdapter } = require("@socket.io/redis-adapter");
  const redisClient = require("./redis");

  io = new Server(server,{
    cors: {
      origin: ["https://task-management-system-lilac-six.vercel.app","http://localhost:5173"],
      credentials: true
    }
  });

  const pubClient = redisClient;
  const subClient = redisClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};

module.exports = { initSocket, getIO }