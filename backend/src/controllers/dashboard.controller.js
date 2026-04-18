const User = require("../models/user.model");
const Task = require("../models/task.model");
const {getCache,setCache} = require("../services/cache.service")


exports.getAdminDashboard = async (req, res) => {
  try {
    const cacheKey = "admin:dashboard:stats";
    const cachedStats = await getCache(cacheKey);
    if (cachedStats) return res.status(200).json(cachedStats);

    const [totalUsers, totalTasks, completedTasks, topUsers] =
      await Promise.all([
        User.countDocuments({role:"user", isActive:true}),
        Task.countDocuments({isDeleted:false}),
        Task.countDocuments({ status: "completed",isDeleted:false }),

        Task.aggregate([
          {
            $match: { assignedTo: { $ne: null },
          isDeleted: false },
          },
          {
            $group: {
              _id: "$assignedTo",
              completedCount: {
                $sum: {
                  $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
                },
              },
            },
          },
          { $sort: { completedCount: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: "$user" },
          {
            $project: {
              _id: 0,
              userId: "$user._id",
              name: "$user.name",
              email: "$user.email",
              completedCount: 1,
            },
          },
        ]),
      ]);

    res.status(200).json({
      totalUsers,
      totalTasks,
      completedTasks,
      topUsers,
    });
  } catch (error) {
    console.error("Dashboard Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    

    const [totalTasks, pending, inProgress, completed] = await Promise.all([
      Task.countDocuments({ assignedTo: userId, isDeleted: false }),
      Task.countDocuments({ assignedTo: userId, status: "pending", isDeleted: false }),
      Task.countDocuments({ assignedTo: userId, status: "in-progress", isDeleted: false }),
      Task.countDocuments({ assignedTo: userId, status: "completed", isDeleted: false }),
    ]);

    const stats = {
      totalTasks,
      pending,
      inProgress,
      completed,
    };


    res.status(200).json(stats);
  } catch (error) {
    console.error("User Dashboard Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};