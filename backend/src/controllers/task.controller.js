const Task = require("../models/task.model");
const User = require("../models/user.model");
const { getIO } = require("../config/socket");
const {getCache, setCache, clearAllTasksCache} = require("../services/cache.service")
const redisClient = require("../config/redis")

exports.createTask = async (req, res) => {
  try {
    const { title, description, priority, assignedTo } = req.body;

    const task = await Task.create({
      title,
      description,
      priority,
      assignedTo,
      createdBy: req.user.id,
    });

    const io = getIO();
    io.emit("taskCreated", task);

    await clearAllTasksCache();

    res.status(201).json({
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    console.error("Create Task Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.getTasks = async (req, res) => {
  try {
    const rawSearch = req.query.search;
    
    const cacheSearch = rawSearch && rawSearch !== 'undefined' ? rawSearch : "none";
    
    const mongoSearch = rawSearch && rawSearch !== 'undefined' && rawSearch !== 'none' ? rawSearch : "";

    const userId = req.user.id;
    const { status = 'all', difficulty = 'all', page = 1, limit = 10 } = req.query;

    const cacheKey = `tasks:${userId}:${cacheSearch}:${status}:${difficulty}:${page}:${limit}`;

    const cachedData = await getCache(cacheKey);
    if (cachedData) return res.status(200).json(cachedData);

    const query = {isDeleted:false};
    if (req.user.role === "user") {
      query.assignedTo = userId;
    }

    if (mongoSearch.trim().length > 0) {
      query.$text = { $search: mongoSearch };
    }

    if (status && status !== 'all') query.status = status;
    if (difficulty && difficulty !== 'all') query.difficulty = difficulty;

    const skip = (page - 1) * parseInt(limit);
    const [tasks, total] = await Promise.all([
      Task.find(query)
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Task.countDocuments(query),
    ]);

    const response = { total, page, totalPages: Math.ceil(total / limit), data: tasks };
    await setCache(cacheKey, response);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.getMyTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const cacheKey = `tasks:user:${userId}`;

    const cachedData = await getCache(cacheKey);
    if (cachedData) return res.status(200).json(cachedData);

    const tasks = await Task.find({ assignedTo: userId, isDeleted: false })
      .sort({ createdAt: -1 });

    await setCache(cacheKey, tasks);

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Get My Tasks Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name email")
      // .populate("createdBy", "name email");

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    
    if (
      req.user.role === "user" &&
      task.assignedTo?.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.status(200).json(task);
  } catch (error) {
    console.error("Get Task Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (req.user.role === "user") {
      if (task.assignedTo?.toString() !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (req.body.status) {
        task.status = req.body.status;
      }
    } 
    else if (req.user.role === "admin") {
      Object.assign(task, req.body);
    }

    await task.save();

    const io = getIO();
    io.emit("taskUpdated", task);

    await clearAllTasksCache();

    res.status(200).json({
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    console.error("Update Task Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id,{isDeleted:true},{returnDocument:"after"});

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const io = getIO();
    io.emit("taskDeleted", { id: req.params.id });

    await clearAllTasksCache();


    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete Task Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};