const notificationService = require("./notification.service");
const Notification = require("../../shared/models/notification.model")
exports.getMyNotifications = async (req, res) => {
    try {
        const teamIds = req.user.teams || [];
        const notifications = await notificationService.getUserNotifications(req.user.id,teamIds);
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch notifications",error:error.message });
    }
};


exports.markRead = async (req, res) => {
    try {
        const notification = await notificationService.markAsRead(req.params.id);
        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ message: "Failed to update notification" });
    }
};


exports.markAllRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user.id, isRead: false },
            { isRead: true }
        );
        res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        res.status(500).json({ message: "Failed to update notifications",error:error.message });
    }
};