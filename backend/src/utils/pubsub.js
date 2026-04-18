const redisClient = require("../config/redis");

const publishEvent = async (channel, data) => {
  await redisClient.publish(channel, JSON.stringify(data));
};

module.exports = { publishEvent };