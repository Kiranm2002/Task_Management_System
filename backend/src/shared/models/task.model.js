const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  status: { 
    type: String, 
    enum: ["backlog", "todo", "in-progress", "in-review", "blocked", "completed", "archived"], 
    default: "todo" 
  },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  estimatedHours: { type: Number, default: 0 },
  actualHours: { type: Number, default: 0 },
  dueDate: { type: Date },
  
  dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }], 
  attachments: [{
    url: String,
    filename: String,
    fileType: String
  }],
  subtasks: [
  {
    title: { type: String, required: true },
    isCompleted: { type: Boolean, default: false }
  }
],
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

taskSchema.index({ title: "text", description: "text" });
module.exports = mongoose.model("Task", taskSchema);


