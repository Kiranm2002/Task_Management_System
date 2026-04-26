const { Queue } = require("bullmq");
const redisClient = require("../../config/redis");

const notificationQueue = new Queue("notificationQueue", { 
    connection: { host: '127.0.0.1', port: 6379 } 
});

const addNotificationJob = async (data) => {
    await notificationQueue.add("sendNotification", data, {
        attempts: 3, 
        backoff: 5000 
    });
};

module.exports = { addNotificationJob };