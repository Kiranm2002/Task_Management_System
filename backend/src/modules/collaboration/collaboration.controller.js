const collabService = require("./collaboration.service");
const Task = require("../../shared/models/task.model");
const {Comment} = require("../../shared/models/collaboration.model")
const {getIO} = require("../../config/socket");
const User = require("../../shared/models/user.model");
const emailService = require("../../shared/services/email.service");

exports.addComment = async (req, res) => {
    try {
        const { taskId, text, mentionedUsers } = req.body;

        const task = await Task.findById(taskId).populate("assignedTo createdBy");
        if (!task) return res.status(404).json({ message: "Task not found" });

        const comment = await collabService.postComment({
            taskId,
            userId: req.user.id, 
            content : text,
            mentions:mentionedUsers
        });

        await collabService.logActivity(taskId, req.user.id, "COMMENT_ADDED", null, text);

        const populatedComment = await comment.populate("userId", "name avatar");

        const senderName = populatedComment.userId?.name || "A team member";
        

        if (mentionedUsers && mentionedUsers.length > 0) {
            const io = getIO();
            
            for (const userId of mentionedUsers) {
                if (io) {
                    io.to(userId.toString()).emit("new_notification", {
                        message: `${senderName} mentioned you in a comment`,
                        taskId: taskId,
                        senderName: senderName,
                        createdAt: new Date().toISOString()
                    });
                }

                const mentionedUser = await User.findById(userId);
                if (mentionedUser && mentionedUser.email && userId.toString() !== req.user.id) {
                    emailService.sendTaskNotificationEmail(
                        mentionedUser.email,
                        "You were mentioned in a comment",
                        `${senderName} mentioned you in a task comment: "${text}"`,
                        task.title
                    ).catch(err => console.error("Mention Email Error:", err));
                }
            }
        }
        const recipientId = (req.user.id === task.assignedTo?._id.toString()) 
                            ? task.createdBy?._id 
                            : task.assignedTo?._id;

        const isAlreadyMentioned = mentionedUsers?.includes(recipientId?.toString());

        if (recipientId && !isAlreadyMentioned && recipientId.toString() !== req.user.id) {
            const recipient = await User.findById(recipientId);
            if (recipient && recipient.email) {
                emailService.sendTaskNotificationEmail(
                    recipient.email,
                    "New Comment on your Task",
                    `${senderName} added a comment: "${text}"`,
                    task.title
                ).catch(err => console.error("Comment Email Error:", err));
            }
        }
        res.status(201).json(populatedComment);
    } catch (error) {
        res.status(500).json({ message: "Failed to add comment", error: error.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const { taskId } = req.params;
        const history = await collabService.getTaskHistory(taskId);
        
        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch task history", error: error.message });
    }
};

exports.deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;
        
        const comment = await Comment.findOne({ _id: commentId, isDelete: false });

        if (!comment) {
            return res.status(404).json({ message: "Comment not found or already deleted" });
        }
        
        if (comment.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Unauthorized to delete this comment" });
        }

        await collabService.softDeleteComment(commentId);

        res.status(200).json({ success: true, message: "Comment removed successfully" });
    } catch (error) {
        res.status(500).json({ message: "Delete failed", error: error.message });
    }
};