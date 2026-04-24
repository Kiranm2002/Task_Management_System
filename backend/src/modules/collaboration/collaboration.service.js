const { Activity, Comment } = require("../../shared/models/collaboration.model");

exports.logActivity = async (taskId, userId, action, fromValue, toValue) => {
    let description = `${action.replace('_', ' ')}`;
    if (fromValue !== null && toValue !== null) {
        description = `Changed status from ${fromValue} to ${toValue}`;
    }

    return await Activity.create({
        taskId,
        userId,
        action,
        description, 
        details: { from: fromValue, to: toValue }
    });
};

exports.postComment = async (commentData) => {
    return await Comment.create(commentData);
};

exports.softDeleteComment = async (commentId) => {
    return await Comment.findByIdAndUpdate(
        commentId, 
        { isDelete: true }, 
        { new: true }
    );
};

exports.getTaskHistory = async (taskId) => {
    const [activities, comments] = await Promise.all([
        Activity.find({ taskId,isDelete:false }).populate("userId", "name avatar").lean(),
        Comment.find({ taskId, isDelete:false }).populate("userId", "name avatar").lean()
    ]);

    const combined = [
        ...activities.map(a => ({ ...a, type: 'activity' })),
        ...comments.map(c => ({ ...c, type: 'comment' }))
    ];

    return combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};