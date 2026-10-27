importScripts('https://www.gstatic.com/firebasejs/13.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/13.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCJ_Aq79fLcwGCgtZLBd-wcrKCwUpzCcHM',
  authDomain: 'smart-water-tank-e49d6.firebaseapp.com',
  projectId: 'smart-water-tank-e49d6',
  messagingSenderId: '1093326028578',
  appId: '1:1093326028578:web:3e14241e31690859662f7b',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const title = notification.title || 'Notifikasi Smart Water Tank';
  const options = {
    body: notification.body || 'Ada pembaruan alarm toren.',
    tag: payload.data?.notificationId,
    data: { url: payload.fcmOptions?.link || '/' },
  };

  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(self.clients.openWindow(url));
});
