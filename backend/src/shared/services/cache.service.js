const redisClient = require("../../config/redis");

const DEFAULT_TTL = 60 * 5;

const setCache = async (key, data, ttl = DEFAULT_TTL) => {
  try {
    await redisClient.set(key, JSON.stringify(data),"EX",ttl);
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
    const taskKeys = await redisClient.keys("tasks:*");
    const adminKeys = await redisClient.keys("admin:dashboard:*");
    const allKeys = [...taskKeys, ...adminKeys];
    if (allKeys.length > 0) {
      await redisClient.del(...allKeys);
    }
  } catch (error) {
    console.error("Cache Clear Error:", error.message);
  }
};

const delCache = async (key) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error("Cache DELETE Error:", error.message);
  }
};

module.exports = {
  setCache,
  getCache,
  clearAllTasksCache,
  delCache
};