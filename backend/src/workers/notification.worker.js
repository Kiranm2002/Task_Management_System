const { Worker } = require("bullmq");
const redisClient = require("../config/redis");
const emailService = require("../shared/services/email.service"); 

const worker = new Worker("notificationQueue", async (job) => {
    const { recipientId, message, type } = job.data;
    
    try {
        console.log(`[Worker] Processing ${type} for ${recipientId}`);
        
        await emailService.sendNotificationEmail(recipientId, type, message);
        
    } catch (error) {
        console.error(`[Worker Error] Job ${job.id} failed:`, error);
        throw error; 
    }
}, { connection: redisClient });

worker.on("completed", (job) => console.log(`[Worker] Job ${job.id} - Email Sent Successfully`));