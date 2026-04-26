const Task = require("../../shared/models/task.model");
const collabService = require("../collaboration/collaboration.service");
const notificationService = require("../notifications/notification.service");
const analyticsService = require("../analytics/analytics.service");
const aiService = require("../ai/ai.service");
const {getIO} = require("../../config/socket")
const emailService = require("../../shared/services/email.service");
const User = require("../../shared/models/user.model");

exports.createTask = async (taskData, files, userId) => {
    let attachments = [];
    if (files && files.length > 0) {
        attachments = files.map(file => ({
            url: file.path,
            filename: file.originalname,
            fileType: file.mimetype
        }));
    }

    let finalDescription = taskData.description;
    let finalPriority = taskData.priority;
    let finalSubtasks = [];

    if (taskData.subtasks) {
        try {
            let parsed = typeof taskData.subtasks === 'string' 
                ? JSON.parse(taskData.subtasks) 
                : taskData.subtasks;

            finalSubtasks = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            console.error("JSON Parse Error in subtasks:", e);
            finalSubtasks = [];
        }
    }

    if ((!finalDescription || taskData.useAI === 'true') && (!finalSubtasks || finalSubtasks.length === 0)) {
        try {
            const aiData = await aiService.generateAIDescription(taskData.title);
            finalDescription = aiData.description;
            finalPriority = aiData.priority;
            finalSubtasks = aiData.subtasks.map(st => ({ title: st, isCompleted: false })); 
        } catch (error) {
            console.error("AI Generation failed, using defaults:", error);
            finalDescription = finalDescription || "No description provided.";
        }
    }

    let finalDependencies = Array.isArray(taskData.dependencies) ? [...taskData.dependencies] : [];

    if (taskData.assignedTo) {
        const lastIncompleteTask = await Task.findOne({
            assignedTo: taskData.assignedTo,
            status: { $ne: "completed" },
            isDeleted: false
        }).sort({ createdAt: -1 });

        if (lastIncompleteTask && !finalDependencies.includes(lastIncompleteTask._id.toString())) {
            finalDependencies.push(lastIncompleteTask._id);
        }
    }

    const task = await Task.create({
        ...taskData,
        description: finalDescription,
        priority: finalPriority || taskData.priority || "medium",
        subtasks: finalSubtasks, 
        createdBy: userId,
        attachments,
        dependencies: finalDependencies 
    });
    
    await collabService.logActivity(task._id, userId, "TASK_CREATED", null, task.title);

    if (task.assignedTo) {
        await notificationService.createNotification(
            task.assignedTo, 
            userId, 
            "TASK_ASSIGNMENT", 
            `New task assigned: ${task.title}`, 
            task._id
        );

        const assignee = await User.findById(task.assignedTo);
        if (assignee && assignee.email) {
            emailService.sendTaskNotificationEmail(
                assignee.email,
                "New Task Assigned",
                "You have been assigned a new task in the Enterprise Task Manager.",
                task.title
            );
        }
    }
    
    return task;
};

exports.getAllTasks = async (query = {}) => {
    return await Task.find({ isDeleted: false })
        .populate("assignedTo", "name avatar") 
        .populate("projectId", "name")
        // .populate("team", "name")
        .sort({ createdAt: -1 });
};

exports.deleteTask = async (taskId) => {
    const task = await Task.findById(taskId);
    if (!task) throw new Error("Task not found");
    
    task.isDeleted = true;
    await task.save();
    return task;
};

exports.getProjectTasks = async (projectId, filters) => {
    const { status, priority, search } = filters;
    const query = { projectId, isDeleted: false };

    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;
    if (search) query.$text = { $search: search };

    return await Task.find(query)
        .populate("assignedTo", "name avatar")
        .sort({ dueDate: 1 });
};

exports.updateTaskDetails = async (taskId, updateData, userId, userRole, newFiles = []) => {
    const task = await Task.findById(taskId);
    if (!task) throw new Error("Task not found");

    const oldStatus = task.status;
    const oldPriority = task.priority;
    const oldAssignee = task.assignedTo ? task.assignedTo.toString() : null;

    const newStatus = updateData.status;

    const activeStatuses = ["in-progress", "in-review", "completed"];
    if (newStatus && activeStatuses.includes(newStatus) && oldStatus !== newStatus) {
        if (task.dependencies && task.dependencies.length > 0) {
            const blockers = await Task.find({
                _id: { $in: task.dependencies },
                status: { $ne: "completed" },
                isDeleted: false
            });

            if (blockers.length > 0) {
                const blockerTitles = blockers.map(b => b.title).join(", ");
                throw new Error(`Cannot move to '${newStatus}'. Blocker tasks incomplete: ${blockerTitles}`);
            }
        }
    }

    if (userRole === "user") {
        const assigneeId = task.assignedTo ? task.assignedTo.toString() : null;
        const currentUserId = userId.toString();
        if (assigneeId !== currentUserId) {
            throw new Error("Access Denied");
        }
        
        if (newStatus) task.status = newStatus;
        if (updateData.actualHours !== undefined) task.actualHours = updateData.actualHours;
        if (updateData.startDate) task.startDate = updateData.startDate;
        if (Object.prototype.hasOwnProperty.call(updateData, 'completedAt')) {
            task.completedAt = updateData.completedAt;
        }
    } else {
        if (updateData.title) task.title = updateData.title;
    
        if (Object.prototype.hasOwnProperty.call(updateData, 'description')) {
            task.description = updateData.description;
        }

        if (updateData.projectId) task.projectId = updateData.projectId;
        if (updateData.status) task.status = updateData.status;
        
        if (updateData.priority && oldPriority !== updateData.priority) {
            task.priority = updateData.priority;
            await collabService.logActivity(taskId, userId, "PRIORITY_CHANGE", oldPriority, updateData.priority);
        }

        if (updateData.assignedTo && oldAssignee !== updateData.assignedTo.toString()) {
            task.assignedTo = updateData.assignedTo;
            await collabService.logActivity(taskId, userId, "ASSIGNMENT_CHANGE", oldAssignee, updateData.assignedTo);
        }
        
        if (updateData.estimatedHours !== undefined) task.estimatedHours = Number(updateData.estimatedHours);
        if (updateData.actualHours !== undefined) task.actualHours = Number(updateData.actualHours);
        
        if (updateData.dueDate) task.dueDate = updateData.dueDate;
        if (updateData.startDate) task.startDate = updateData.startDate;
        if (Object.prototype.hasOwnProperty.call(updateData, 'completedAt')) {
            task.completedAt = updateData.completedAt;
        }
    }

    if (newFiles && newFiles.length > 0) {
        const newlyUploaded = newFiles.map(file => ({
            url: file.path, 
            filename: file.originalname,
            fileType: file.mimetype
        }));

        task.attachments.push(...newlyUploaded);
        
        await collabService.logActivity(taskId, userId, "ATTACHMENT_UPLOADED", null, `${newFiles.length} file(s) added`);
    }

    await task.save();

    if (newStatus && oldStatus !== newStatus) {
        const activityAction = newStatus === "completed" ? "TASK_COMPLETED" : "STATUS_CHANGE";
        await collabService.logActivity(taskId, userId, activityAction, oldStatus, newStatus);
        
        const recipientId = (userRole === 'admin') ? task.assignedTo : task.createdBy;
        
        if (recipientId && recipientId.toString() !== userId.toString()) {
            await notificationService.createNotification(
                recipientId, 
                userId, 
                newStatus === "completed" ? "TASK_COMPLETED" : "STATUS_CHANGE", 
                `Task "${task.title}" moved from ${oldStatus} to ${newStatus}`, 
                task._id
            );
            const recipient = await User.findById(recipientId);
            if (recipient && recipient.email) {
                emailService.sendTaskNotificationEmail(
                    recipient.email,
                    `Task Status Updated: ${newStatus}`,
                    `The status of your task has been updated to ${newStatus}.`,
                    task.title
                );
            }
            const io = getIO();
            io.emit("TASK_UPDATED", task);
            io.emit("TASK_LIST_REFRESH");
        }
    }

    return task;
};

exports.moveTaskKanban = async (taskId, newStatus, userId, userRole, io) => {

    const task = await Task.findById(taskId).populate("dependencies");
    if (!task) throw new Error("Task not found");

    const activeStatuses = ["in-progress", "in-review", "completed"];
    
    if (activeStatuses.includes(newStatus)) {
        const incompleteDependencies = task.dependencies.filter(
            (dep) => dep.status !== "completed"
        );

        if (incompleteDependencies.length > 0) {
            const names = incompleteDependencies.map(d => d.title).join(", ");
            throw new Error(`Cannot start task. The following dependencies are incomplete: ${names}`);
        }
    }

    const updateData = { status: newStatus };
    if (newStatus === "in-progress" && !task.startDate) {
        updateData.startDate = new Date();
    }
    if (newStatus === "completed") {
        // updateData.completedAt = new Date();
        const completionDate = new Date();
        updateData.completedAt = completionDate;
        if (task.startDate) {
            const diffInMs = completionDate - new Date(task.startDate);
            const totalHours = Math.max(0.1, diffInMs / (1000 * 60 * 60)); 
            updateData.actualHours = parseFloat(totalHours.toFixed(2));
        } else {
            updateData.actualHours = 0.5; 
        }
    } else if (task.status === "completed" && newStatus !== "completed") {
        updateData.completedAt = null;
    }

    const updatedTask = await this.updateTaskDetails(taskId, updateData, userId, userRole);
    if (!updatedTask) throw new Error("Task not found");
    
    const projectIdStr = updatedTask.projectId._id?.toString() || updatedTask.projectId.toString();
    const assignedToId = updatedTask.assignedTo._id?.toString() || updatedTask.assignedTo.toString();

    io.to(projectIdStr).emit("TASK_UPDATED", updatedTask);
    io.to(assignedToId).emit("TASK_UPDATED", updatedTask);
    io.emit("TASK_LIST_REFRESH", { taskId, newStatus });
    

    try {
        const deepAnalytics = await analyticsService.getDeepAnalytics();
        io.to("admin_analytics_room").emit("DEEP_STATS_UPDATE", deepAnalytics);
    } catch (error) {
        console.error("Analytics emission failed:", error.message);
    }
    
    return updatedTask;
};

exports.updateSubtaskStatus = async (taskId, subtaskId, isCompleted) => {
    const task = await Task.findOneAndUpdate(
        { _id: taskId, "subtasks._id": subtaskId },
        { $set: { "subtasks.$.isCompleted": isCompleted } },
        { new: true }
    );
    if (!task) throw new Error("Task or Subtask not found");
    return task;
};

exports.getUserTasksForKanban = async (userId,filters={}) => {
    const { status, limit } = filters;
    
    let query = { 
        assignedTo: userId, 
        isDeleted: false 
    };

    if (status) query.status = status;
    
    let tasksQuery = Task.find(query)
        .populate("assignedTo", "name avatar")
        .populate("projectId", "name");

    if (limit) {
        tasksQuery = tasksQuery.sort({ dueDate: 1 }).limit(parseInt(limit));
    } else {
        tasksQuery = tasksQuery.sort({ updatedAt: -1 });
    }
    return await tasksQuery;
};

exports.addAttachments = async (taskId, files, userId) => {
  const task = await Task.findById(taskId);
  if (!task) throw new Error("Task not found");

  const newAttachments = files.map(file => ({
    url: file.path,
    filename: file.originalname,
    fileType: file.mimetype
  }));

  task.attachments.push(...newAttachments);
  await task.save();

  await collabService.logActivity(
    taskId, 
    userId, 
    "ATTACHMENT_UPLOADED", 
    null, 
    `${files.length} file(s) added`
  );

  return task;
};

exports.getTasksByProjectId = async (projectId) => {
    return await Task.find({ 
        projectId: projectId, 
        isDeleted: { $ne: true } 
    }).populate("assignedTo", "name avatar")
    .populate("createdBy", "name");
};