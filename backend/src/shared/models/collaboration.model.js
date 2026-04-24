const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  action: { 
    type: String, 
    required: true, 
    enum: ["TASK_CREATED", "STATUS_CHANGE", "PRIORITY_CHANGE", "ASSIGNMENT_CHANGE", "COMMENT_ADDED", "ATTACHMENT_UPLOADED"] 
  },
  description: { type: String }, 
  details: {
    from: { type: mongoose.Schema.Types.Mixed }, 
    to: { type: mongoose.Schema.Types.Mixed }
  },
  ipAddress: { type: String } ,
  isDelete:{type:Boolean,default:false}
}, { timestamps: true });

const commentSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String,required:true }, 
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  
  isDelete:{type:Boolean,default:false}
}, { timestamps: true });

const Activity = mongoose.model("Activity", activitySchema);
const Comment = mongoose.model("Comment", commentSchema);

module.exports = { Activity, Comment };