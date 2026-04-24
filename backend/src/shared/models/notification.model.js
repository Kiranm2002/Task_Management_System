const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: { 
    type: String, 
    enum: ["TASK_ASSIGNMENT", "STATUS_CHANGE", "MENTION", "DUE_DATE_REMINDER","TASK_COMPLETED","AI_WARNING"], 
    required: true 
  },
  message: { type: String, required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);