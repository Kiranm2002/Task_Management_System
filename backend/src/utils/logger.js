const { Activity } = require("../shared/models/collaboration.model");

const logActivity = async ({ taskId, userId, action, description, from, to, req }) => {
  try {
    await Activity.create({
      taskId,
      userId,
      action,
      description,
      details: { from, to },
      ipAddress: req?.ip || 'internal'
    });
  } catch (error) {
    console.error("Activity Logging Failed:", error);
  }
};

module.exports = logActivity;