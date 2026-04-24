
const redisClient = require("../config/redis");

const publishEvent = async (channel, data) => {
    try {
        const count = await redisClient.publish(channel, JSON.stringify(data));
        return count;
    } catch (error) {
        console.error(`Redis Publish Error on channel ${channel}:`, error);
        throw error;
    }
};

module.exports = { publishEvent };