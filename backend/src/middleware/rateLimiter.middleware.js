const { RateLimiterRedis } = require("rate-limiter-flexible");
const redisClient = require("../config/redis"); 

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "login_fail",
  points: 10,
  duration: 15 * 60,
});

const loginRateLimiter = async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (error) {
    return res.status(429).json({
      message: "Too many login attempts. Try again later.",
    });
  }
};

module.exports = loginRateLimiter;