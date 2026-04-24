const Notification = require("../../shared/models/notification.model");
const emailService = require("../../shared/services/email.service");
const { getIO } = require("../../config/socket"); 
const redisClient = require("../../config/redis");
const {Queue} = require('bullmq');
const notificationQueue = new Queue('notifications',{connection:redisClient});

exports.createNotification = async (recipientId, senderId, type, message, taskId) => {
    const notification = await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type,
        message,
        taskId
    });

    const io = getIO();
    io.to(recipientId.toString()).emit("new_notification", notification);

    await notificationQueue.add("sendNotification", {
        recipientId,
        type,
        message,
        notificationId: notification._id
    });

    return notification;
};

exports.getUserNotifications = async (userId, teamIds=[]) => {
    return await Notification.find({ 
        $or: [
            { recipient: userId },          
            { recipient: { $in: teamIds } }  
        ] })
        .sort({ createdAt: -1 })
        .limit(20);
};

exports.markAsRead = async (notificationId) => {
    return await Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
};