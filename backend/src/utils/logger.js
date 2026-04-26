const { Activity } = require("../shared/models/collaboration.model");

const logActivity = async ({ taskId, userId, action, description, from, to, req }) => {
  try {
    const ip = req ? (req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress) : 'internal';
    await Activity.create({
      taskId,
      userId,
      action,
      description,
      details: { from, to },
      ipAddress: ip
    });
  } catch (error) {
    console.error(`[Audit Log Error] Task: ${taskId} | Action: ${action}:`, error);
  }
};

module.exports = logActivity;