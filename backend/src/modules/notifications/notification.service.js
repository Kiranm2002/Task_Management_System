const Notification = require("../../shared/models/notification.model");
const emailService = require("../../shared/services/email.service");
const { getIO } = require("../../config/socket"); 
const redisClient = require("../../config/redis");
const {Queue} = require('bullmq');
const notificationQueue = new Queue('notifications',{connection:redisClient});
const webpush = require("web-push");
const PushSubscription = require("../../shared/models/pushSubscription.model");

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

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
        notificationId: notification._id,
        taskId
    });

    return notification;
};

exports.sendBrowserPush = async (recipientId, title, body, taskId) => {
    try {
        const subscriptions = await PushSubscription.find({ user: recipientId });
        
        const payload = JSON.stringify({
            title: title,
            body: body,
            url: `/user-dashboard/tasks/${taskId || ''}` 
        });

        const pushPromises = subscriptions.map(sub => 
            webpush.sendNotification(sub.subscription, payload).catch(async (err) => {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await PushSubscription.deleteOne({ _id: sub._id });
                }
            })
        );

        await Promise.all(pushPromises);
    } catch (error) {
        console.error("Browser Push Error:", error);
    }
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