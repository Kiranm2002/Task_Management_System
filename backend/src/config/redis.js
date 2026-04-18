const Redis = require("ioredis");

const redisClient = new Redis(process.env.REDIS_URL, {
  tls: {
    rejectUnauthorized: false 
  },
  retryStrategy: (times) => {
    return Math.min(times * 50, 2000);
  }
});

redisClient.on("connect", () => console.log("Redis Connected via TCP (ioredis)"));
redisClient.on("error", (err) => console.error("Redis Error:", err));

module.exports = redisClient;