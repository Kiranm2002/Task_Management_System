const aiService = require("../services/ai.service");
const User = require("../models/user.model");
const Task = require("../models/task.model");

exports.generateDescription = async (req, res) => {
  try {
    const desc = await aiService.generateAIDescription(req.body.title);
    res.json({ desc });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate description" });
  }
};

exports.searchParse = async (req, res) => {
  try {
    const query = await aiService.parseNaturalLanguage(req.body.text);
    res.json({ query });
  } catch (error) {
    res.status(500).json({ error: "Failed to parse search query" });
  }
};

exports.recommendUser = async (req, res) => {
  try {
    const users = await User.find({ role: "user", isActive: true }).lean();

    const userWorkload = await Promise.all(
      users.map(async (u) => {
        const count = await Task.countDocuments({
          assignedTo: u._id,
          status: { $in: ["pending", "in-progress"] }, 
        });
        return { name: u.name, activeTasks: count };
      })
    );

    const advice = await aiService.getAssignmentAdvice(req.body.title, userWorkload);
    res.json({ advice });
  } catch (error) {
    console.error("Recommendation Error:", error);
    res.status(500).json({ error: "Failed to get AI recommendation" });
  }
};