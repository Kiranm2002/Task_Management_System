const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const loginRateLimiter = require("../../shared/middleware/rateLimiter.middleware");
const authMiddleware = require("../../shared/middleware/auth.middleware");
const {verifyCSRF} = require("../../shared/middleware/crsf.middleware")

router.post("/register", authController.register);
router.post("/login", loginRateLimiter, authController.login);
router.post("/2fa/setup", authMiddleware, authController.setup2FA);
router.post("/2fa/verify-enable", authMiddleware, authController.verifyAndEnable2FA);
router.post("/2fa/login", authController.login2FA);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authMiddleware, authController.logout);
router.get("/verify-email/:token", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerification);
router.post("/forgot-password", authController.forgotPassword);
router.patch("/reset-password/:token", authController.resetPassword);

module.exports = router;