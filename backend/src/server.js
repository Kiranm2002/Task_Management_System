const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const connectDB = require("./config/db.js");
const app = require("./app.js");
const redisClient = require("./config/redis.js")
const { initSocket } = require("./config/socket");


const PORT = process.env.PORT || 5000;


const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });

     initSocket(server);
    
    process.on("SIGINT", async () => {
      console.log("Shutting down server...");
      await mongoose.connection.close();
      server.close(() => {
        process.exit(0);
      });
    });

  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();