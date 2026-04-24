const { Queue } = require("bullmq");
const redisClient = require("./redis"); 

const notificationQueue = new Queue("notificationQueue", {
  connection: redisClient
});

module.exports = notificationQueue;