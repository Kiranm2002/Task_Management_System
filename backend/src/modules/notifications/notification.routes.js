const express = require("express");
const router = express.Router();
const notificationController = require("./notification.controller");
const authMiddleware = require("../../shared/middleware/auth.middleware");

router.use(authMiddleware);

router.get("/", notificationController.getMyNotifications);
router.patch("/:id/read", notificationController.markRead);
router.patch("/read-all", notificationController.markAllRead);
router.post("/subscribe",notificationController.subscribePush);

module.exports = router;