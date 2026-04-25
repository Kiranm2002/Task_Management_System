const Project = require("../../shared/models/project.model");
const Task = require("../../shared/models/task.model");


exports.createNewProject = async (projectData) => {
    const project = await Project.create(projectData);
    return await project.populate([
        { path: "teamId", select: "name" },
        { path: "createdBy", select: "name" }
    ]);
};

exports.getAllProjects = async () => {
    return await Project.find({ isDeleted: { $ne: true } })
        .populate({
            path: "teamId",
            select: "name members",
            populate: {
                path: "members",
                select: "name email"
            }
        })
        .populate("createdBy", "name")
        .sort({ createdAt: -1 });
};

exports.updateProject = async (projectId, updateData) => {
    return await Project.findByIdAndUpdate(
        projectId,
        { $set: updateData },
        { new: true }
    ).populate("teamId", "name").populate("createdBy", "name");
};

exports.fetchTeamProjects = async (teamId) => {
    return await Project.find({ teamId: teamId, 
        status: { $ne: "archived" },
        isDeleted: { $ne: true } })
        .populate("teamId", "name")
        .populate("createdBy", "name")
        .sort({ createdAt: -1 });
};

exports.getProjectDetails = async (projectId) => {
    return await Project.findOne({ 
        _id: projectId, 
        isDeleted: { $ne: true } 
    }).populate({
        path: "teamId",
        select: "name members",
        populate: {
            path: "members",
            select: "name email",
        }     
    });
};



exports.softDeleteProject = async (projectId) => {
    return await Project.findByIdAndUpdate(
        projectId,
        { $set: { isDeleted: true } },
        { new: true }
    );
};