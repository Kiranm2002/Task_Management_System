const express = require("express");
const router = express.Router();
const aiService = require("../services/ai.service");
const User = require("../models/user.model");
const Task = require("../models/task.model");

router.post("/generate-desc", async (req, res) => {
  const desc = await aiService.generateAIDescription(req.body.title);
  res.json({ desc });
});

router.post("/search-parse", async (req, res) => {
  const query = await aiService.parseNaturalLanguage(req.body.text);
  res.json({ query });
});

router.post("/recommend", async (req, res) => {
  const users = await User.find().lean();
  const userWorkload = await Promise.all(users.map(async (u) => {
    const count = await Task.countDocuments({ assignedTo: u._id, status: "in-progress" });
    return { name: u.name, activeTasks: count };
  }));

  const advice = await aiService.getAssignmentAdvice(req.body.title, userWorkload);
  res.json({ advice });
});
module.exports = router;