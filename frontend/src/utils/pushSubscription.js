const PUBLIC_VAPID_KEY = "BHF0a8sDnUvoO6gONRSrK1J6GeF-3DmLFjCNhjWHihImzEiQhC7XYQGZ87rt4fLjxZtV8bEMgwpQphmxQWGUvGo";

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const subscribeToNotifications = async (userId, token) => {
  try {
    
    if (!('serviceWorker' in navigator)) {
        console.error("Service Workers not supported in this browser");
        return;
    }
    
    const registration = await navigator.serviceWorker.ready;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('User denied notification permission');
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
    });

    const response = await fetch('http://localhost:5000/api/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify({
        userId: userId,
        subscription: subscription
      }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save subscription on server');
    }

    console.log('Successfully subscribed to Push Notifications');
  } catch (error) {
    console.error('Error during push subscription:', error);
  }
};