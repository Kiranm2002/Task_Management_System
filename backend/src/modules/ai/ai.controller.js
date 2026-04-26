const mongoose = require("mongoose")
const aiService = require("./ai.service");
const User = require("../../shared/models/user.model"); 
const Task = require("../../shared/models/task.model"); 
const Team = require("../../shared/models/team.model"); 
const notificationService = require("../notifications/notification.service")

exports.generateDescription = async (req, res) => {
    try {
        const { title } = req.body;
        const result = await aiService.generateAIDescription(title);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Failed to generate description",error:error.message });
    }
};

exports.searchParse = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ success: false, message: "Search text is required" });
        }
        const context = {
            teamId: req.user.teamId, 
            userId: req.user._id
        };

        const { type, payload } = await aiService.parseNaturalLanguage(q, context);

        let results;
        if (type === "AGGREGATE") {
            results = await Task.aggregate(payload);
        } else {
            results = await Task.find(payload).populate("assignedTo", "name");
        }

        res.status(200).json({
            success: true,
            queryType: type,
            count: results.length,
            data: results
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


exports.recommendUser = async (req, res) => {
    try {
        const { title, teamId } = req.body;
        const team = await Team.findById(teamId).populate("members", "name _id role");
        if (!team) return res.status(404).json({ error: "Team not found" });

        const userWorkload = await Promise.all(
            team.members.map(async (u) => {
                const count = await Task.countDocuments({
                    assignedTo: u._id,
                    status: { $in: ["todo", "in-progress", "in-review"] }, 
                });
                return { id: u._id, name: u.name, role: u.role, activeTasks: count };
            })
        );

        const advice = await aiService.getAssignmentAdvice(title, userWorkload);
        res.json({ advice });
    } catch (error) {
        res.status(500).json({ error: "Failed to get AI recommendation" });
    }
};

exports.getDelayPrediction = async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await Task.findById(taskId);
        
        if (!task) return res.status(404).json({ error: "Task not found" });

        const history = await Task.find({ 
            assignedTo: task.assignedTo, 
            status: "completed" 
        }).limit(5).select("estimatedHours actualHours");

        const prediction = await aiService.predictDelay(task, history); 
        res.json(prediction);
    } catch (error) {
        res.status(500).json({ error: "Delay prediction failed" });
    }
};

exports.chatAssistant = async (req, res) => {
    try {
        const { message } = req.body;
        const context = {
            userId: req.user._id,
            userName: req.user.name,
            teamId: req.user.teamId
        };

        const response = await aiService.processAssistantChat(message, context);
        
        res.status(200).json({
            success: true,
            data: response
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.checkTaskRisk = async (req, res) => {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    
    const prediction = await aiService.predictDelay(task, []);

    if (prediction.risk === "high") {
        await notificationService.createNotification(
            task.assignedTo,  
            req.user.id,      
            "AI_WARNING",     
            `AI Warning: "${task.title}" is at high risk of delay. ${prediction.reason}`,
            task._id          
        );
    }
    
    res.json(prediction);
};

