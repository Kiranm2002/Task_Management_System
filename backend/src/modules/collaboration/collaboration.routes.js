const express = require("express");
const router = express.Router();
const collabController = require("./collaboration.controller");
const authMiddleware = require("../../shared/middleware/auth.middleware");

router.post("/comments", authMiddleware, collabController.addComment);

router.get("/tasks/:taskId/history", authMiddleware, collabController.getHistory);

router.delete("/comments/:commentId", authMiddleware, collabController.deleteComment);

module.exports = router;