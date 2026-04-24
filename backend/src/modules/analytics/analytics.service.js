const Task = require("../../shared/models/task.model");
const User = require("../../shared/models/user.model");
const Project = require("../../shared/models/project.model");
const Team = require("../../shared/models/team.model");
const { getCache, setCache } = require("../../shared/services/cache.service");

const getLastWeekDate = () => new Date(new Date() - 7 * 24 * 60 * 60 * 1000);


exports.getAdminAnalytics = async () => {
  const cacheKey = "analytics:admin:overview";
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const [
    totalUsers, 
    totalTeams, 
    totalProjects, 
    totalOverdue, 
    taskDistribution, 
    productivityTrend
  ] = await Promise.all([
    User.countDocuments({ isActive: true, role: "user" }),
    Team.countDocuments({ isDeleted: { $eq: false } }),
    Project.countDocuments({ isDeleted: { $eq: false } }),
    Task.countDocuments({ status: "overdue", isDeleted: false }),

    Task.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]),

    Task.aggregate([
      {
        $match: {
          status: "completed",
          completionDate: { $gte: getLastWeekDate() },
          isDeleted: false
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completionDate" } },
          completedCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  const response = {
    summary: {
      totalUsers,
      totalTeams,
      totalProjects,
      totalOverdue
    },
    taskDistribution,
    productivityTrend
  };

  await setCache(cacheKey, response, 600); 
  return response;
};

exports.getUserAnalytics = async (userId) => {
  const cacheKey = `analytics:user:${userId}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const stats = await Task.aggregate([
    { $match: { assignedTo: userId, isDeleted: false } },
    {
      $group: {
        _id: null,
        assignedCount: { $sum: 1 },
        completedCount: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        inProgressCount: { $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] } },
        overdueCount: { 
          $sum: { 
            $cond: [
              { 
                $and: [
                  { $ne: ["$status", "completed"] },
                  { $lt: ["$dueDate", new Date()] } 
                ]
              }, 1, 0] 
          } 
        },
        totalCompleted: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } }
      }
    },
    {
      $project: {
        _id: 0,
        assignedCount: 1,
        completedCount: 1,
        overdueCount: 1,
        velocity: { 
          $cond: [
            { $eq: ["$assignedCount", 0] }, 
            0, 
            { $round: [{ $multiply: [{ $divide: ["$completedCount", "$assignedCount"] }, 100] }, 0] }
          ] 
        },
        weeklyHours: { $literal: 35 } 
      }
    }
  ]);
    

  const result = stats[0] || { assignedCount: 0, completedCount: 0, overdueCount: 0, velocity: 0, weeklyHours };
  await setCache(cacheKey, result, 300);
  return result;
};

exports.getDeepAnalytics = async () => {
  const cacheKey = "analytics:admin:deep";
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const [priorityDist, taskTrends, projectStats] = await Promise.all([
    Task.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]),

    Task.aggregate([
      { $match: { createdAt: { $gte: getLastWeekDate() }, isDeleted: false } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    Task.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$projectId",
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: "projects",
          localField: "_id",
          foreignField: "_id",
          as: "project"
        }
      },
      { $unwind: "$project" },
      {
        $project: {
          name: "$project.name",
          percentage: { 
          $cond: [
            { $eq: ["$total", 0] }, 
            0, 
            { $multiply: [{ $divide: ["$completed", "$total"] }, 100] }
          ] 
        }
        }
      }
    ])
  ]);

  const result = { priorityDist, taskTrends, projectStats };
  await setCache(cacheKey, result, 600);
  return result;
};

exports.calculateTeamPerformance = async () => {
    return await Team.aggregate([
        {
            $lookup: {
                from: "projects",
                localField: "_id",
                foreignField: "teamId",
                as: "teamProjects"
            }
        },
        { $unwind: { path: "$teamProjects", preserveNullAndEmptyArrays: false } },
        {
            $lookup: {
                from: "tasks",
                localField: "teamProjects._id",
                foreignField: "projectId",
                as: "projectTasks"
            }
        },
        {
            $addFields: {
                completionRate: {
                    $cond: [
                        { $gt: [{ $size: "$projectTasks" }, 0] },
                        {
                            $round: [
                                {
                                    $multiply: [
                                        {
                                            $divide: [
                                                { $size: { $filter: { input: "$projectTasks", as: "t", cond: { $eq: ["$$t.status", "Completed"] } } } },
                                                { $size: "$projectTasks" }
                                            ]
                                        },
                                        100
                                    ]
                                },
                                0
                            ]
                        },
                        0
                    ]
                }
            }
        },
        {
            $group: {
                _id: "$_id",
                name: { $first: "$name" },
                projects: {
                    $push: {
                        _id: "$teamProjects._id",
                        name: "$teamProjects.name",
                        completionRate: "$completionRate"
                    }
                }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                projects: 1
            }
        }
    ]);
};