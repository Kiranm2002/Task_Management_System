const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const loginRateLimiter = require("../middleware/rateLimiter.middleware");

router.post("/register", authController.register);
router.post("/login",loginRateLimiter,authController.login);
router.post("/refresh", authController.refreshToken);

module.exports = router;