const taskService = require("./task.service");
const { getIO } = require("../../config/socket");
const { setCache, getCache, clearAllTasksCache } = require("../../shared/services/cache.service");
const logActivity = require("../../utils/logger")

exports.createTask = async (req, res) => {
    try {
        const task = await taskService.createTask(req.body, req.files, req.user.id);
        
        getIO().to(req.body.projectId).emit("task_created", task);
        await clearAllTasksCache();

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await taskService.getAllTasks(req.query);
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.getTasksByProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const cacheKey = `tasks:project:${projectId}:${JSON.stringify(req.query)}`;

        const cached = await getCache(cacheKey);
        if (cached) return res.status(200).json(cached);

        const tasks = await taskService.getProjectTasks(projectId, req.query);
        
        await setCache(cacheKey, tasks, 3600);
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const task = await taskService.updateTaskDetails(
            req.params.id, 
            req.body, 
            req.user.id, 
            req.user.role,
            req.files
        );


        getIO().to(task.projectId.toString()).emit("task_updated", task);
        await clearAllTasksCache();

        res.status(200).json(task);
    } catch (error) {
        res.status(error.message === "Access Denied" ? 403 : 500).json({ message: error.message });
    }
};

exports.getMyTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const tasks = await taskService.getUserTasksForKanban(userId, req.query);
        
        res.status(200).json({
            success: true,
            data: tasks
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

exports.moveTask = async (req, res) => {
    try {
        const {taskId} = req.params;
        const {  status } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;
        
        const io = getIO();

        const updatedTask = await taskService.moveTaskKanban(
            taskId, 
            status, 
            userId, 
            userRole,
            io
        );
        await clearAllTasksCache();
        res.status(200).json({
            success: true,
            message: "Task moved successfully",
            data: updatedTask
        });
    } catch (error) {
        res.status(400).json({ 
            success: false, 
            message: error.message 
        });
    }
};

exports.uploadAttachments = async (req, res) => {
  try {
    const taskId = req.params.id;
    const files = req.files; 

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const updatedTask = await taskService.addAttachments(taskId, files, req.user.id);

    await clearAllTasksCache();

    res.status(200).json({
      success: true,
      data: updatedTask.attachments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTask = async (req, res) => {
    try {
        await taskService.deleteTask(req.params.id);
        await clearAllTasksCache();
        res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};