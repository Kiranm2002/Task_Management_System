const mongoose = require("mongoose");


const projectSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true },
  description: { type: String },
  teamId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Team", 
    required: true },
  status: { type: String, 
    enum: ["active", "archived", "completed"], 
    default: "active" },
  deadline: { type: Date },
  createdBy:{type:mongoose.Schema.Types.ObjectId},
  isDeleted:{type:Boolean,default:false}
}, 
{ timestamps: true });

module.exports = mongoose.model("Project",projectSchema)