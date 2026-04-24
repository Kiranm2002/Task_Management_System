const express = require("express");
const router = express.Router();
const aiController = require("./ai.controller"); 
const authMiddleware = require("../../shared/middleware/auth.middleware");

router.post("/generate-task", authMiddleware, aiController.generateDescription);
router.get("/search", authMiddleware, aiController.searchParse);
router.post("/recommend", authMiddleware, aiController.recommendUser);
router.get("/delay-prediction/:taskId", authMiddleware, aiController.getDelayPrediction);
router.post("/chat", authMiddleware, aiController.chatAssistant);

module.exports = router;