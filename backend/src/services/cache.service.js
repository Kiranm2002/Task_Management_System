const redisClient = require("../config/redis");

const DEFAULT_TTL = 60 * 5;

const setCache = async (key, data, ttl = DEFAULT_TTL) => {
  try {
    await redisClient.set(key, JSON.stringify(data), {
      ex: ttl,
    });
  } catch (error) {
    console.error("Cache SET Error:", error.message);
  }
};

const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    if (!data) return null;

    if (typeof data === "object") return data;

    if (typeof data === "string") {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Cache GET Error:", error.message);
    return null;
  }
};

const clearAllTasksCache = async () => {
  try {
    const keys = await redisClient.keys("tasks:*"); 
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error("Cache Clear Error:", error.message);
  }
};
module.exports = {
  setCache,
  getCache,
  clearAllTasksCache
};