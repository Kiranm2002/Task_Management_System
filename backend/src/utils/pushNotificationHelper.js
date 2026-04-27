const webpush = require('web-push');
const PushSubscription = require('../shared/models/pushSubscription.model');

webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const sendPushNotification = async (userId, title, body, url = '/') => {
  try {
    const subscriptions = await PushSubscription.find({ user: userId });

    if (subscriptions.length === 0) return;

    const payload = JSON.stringify({ title, body, url });

    const notifications = subscriptions.map(sub => {
      return webpush.sendNotification(sub.subscription, payload)
        .catch(async (err) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await PushSubscription.deleteOne({ _id: sub._id });
          } else {
            console.error('Error sending push notification:', err);
          }
        });
    });

    await Promise.all(notifications);
  } catch (error) {
    console.error('Push Service Main Error:', error);
  }
};

module.exports = sendPushNotification;