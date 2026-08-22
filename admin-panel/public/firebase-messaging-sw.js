importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyC-yVxjHB9_sKuKPUsRv-x_yDXEudxnTII",
  authDomain: "go2pick-345bf.firebaseapp.com",
  projectId: "go2pick-345bf",
  storageBucket: "go2pick-345bf.firebasestorage.app",
  messagingSenderId: "612734922695",
  appId: "1:612734922695:web:c266bc6c0bdd6fd9f373e2",
  measurementId: "G-F8H2FV2HRX"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Go2Pick Notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.message || payload.data?.body || '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: payload.data || {},
    actions: [
      { action: 'open_app', title: 'Open Go2Pick' }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Fallback listener for raw Web Push events when the website is completely closed
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Raw push event received');
  if (!event.data) return;
  try {
    const payload = event.data.json();
    const notificationTitle = payload.notification?.title || payload.data?.title || 'Go2Pick Notification';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.message || payload.data?.body || '',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      data: payload.data || {},
      actions: [
        { action: 'open_app', title: 'Open Go2Pick' }
      ]
    };
    event.waitUntil(self.registration.showNotification(notificationTitle, notificationOptions));
  } catch (err) {
    console.warn('[firebase-messaging-sw.js] Could not parse raw push event:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = new URL('/', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
