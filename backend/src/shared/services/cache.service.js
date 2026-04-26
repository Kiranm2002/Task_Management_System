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

const pushToQueue = async (queueName, data) => {
  try {
    await redisClient.rpush(queueName, JSON.stringify(data));
  } catch (error) {
    console.error("Queue Push Error:", error.message);
  }
};

const setHash = async (key, field, value) => {
  try {
    await redisClient.hset(key, field, JSON.stringify(value));
  } catch (error) {
    console.error("Hash Set Error:", error.message);
  }
};

const clearPattern = async (pattern) => {
  try {
    let cursor = '0';
    do {
      const reply = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = reply[0];
      const keys = reply[1];
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } while (cursor !== '0');
  } catch (error) {
    console.error("Pattern Clear Error:", error.message);
  }
};


module.exports = {
  setCache,
  getCache,
  clearAllTasksCache,
  delCache, pushToQueue, setHash, clearPattern
};