const { Worker } = require("bullmq");
const redisClient = require("../config/redis");
const emailService = require("../shared/services/email.service"); 
const sendPushNotification = require("../utils/pushNotificationHelper");

const worker = new Worker("notificationQueue", async (job) => {
    const { recipientId, message, type, taskId, url } = job.data;
    
    try {
        await emailService.sendNotificationEmail(recipientId, type, message);

        const pushTitle = type.replace(/_/g, ' '); 
        const targetUrl = url || (taskId ? `/user-dashboard/tasks/${taskId}` : '/user-dashboard');
        
        await sendPushNotification(recipientId, pushTitle, message, targetUrl);
        
    } catch (error) {
        console.error(`[Worker Error] Job ${job.id} failed:`, error);
        throw error; 
    }
}, { connection: redisClient });

worker.on("completed", (job) => console.log(`[Worker] Job ${job.id} - Email Sent Successfully`));

