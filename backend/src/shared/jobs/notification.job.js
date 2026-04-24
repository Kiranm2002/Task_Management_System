const cron = require("node-cron");
const Task = require("../models/task.model");
const emailService = require("../services/email.service");

cron.schedule("0 8 * * *", async () => {
    console.log("Checking for approaching and overdue tasks...");
    
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    try {
        const approaching = await Task.find({
            dueDate: { $gte: today, $lte: tomorrow },
            status: { $ne: "completed" },
            isDeleted: false
        }).populate("assignedTo");

        approaching.forEach(task => {
            if (task.assignedTo?.email) {
                emailService.sendTaskNotificationEmail(
                    task.assignedTo.email,
                    "Task Due Soon!",
                    "One of your assigned tasks is due within the next 24 hours.",
                    task.title
                );
            }
        });

        const overdue = await Task.find({
            dueDate: { $lt: today },
            status: { $ne: "completed" },
            isDeleted: false
        }).populate("assignedTo");

        overdue.forEach(task => {
            if (task.assignedTo?.email) {
                emailService.sendTaskNotificationEmail(
                    task.assignedTo.email,
                    "Task Overdue!",
                    "This task is past its deadline. Please update the status.",
                    task.title
                );
            }
        });

    } catch (error) {
        console.error("Cron Job Error:", error);
    }
});