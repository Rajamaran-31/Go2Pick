import { useEffect, useRef } from 'react';
import { getToken, onMessage, isSupported } from 'firebase/messaging';
import { messaging } from '../firebase';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export function usePushNotifications() {
  const { user, token } = useAuth();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!user || !token) return;

    async function initPush() {
      try {
        const supported = await isSupported();
        if (!supported || !messaging) {
          console.log("FCM Messaging is not supported in this browser.");
          return;
        }

        // 1. Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log("Notification permission was not granted.");
          return;
        }

        // 2. Register Service Worker explicitly
        let registration;
        if ('serviceWorker' in navigator) {
          registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log("Firebase Messaging SW registered:", registration);
        }

        // 3. Get FCM device token
        const currentToken = await getToken(messaging, {
          serviceWorkerRegistration: registration,
        });

        if (currentToken) {
          console.log("FCM Device Token retrieved:", currentToken);

          // Send token to backend to associate with this user
          await api.post('/api/notifications/register-fcm-token', { token: currentToken });
          console.log("FCM Token successfully registered with backend.");
        } else {
          console.warn("No registration token available. Request permission to generate one.");
        }

        // 4. Handle foreground notifications (Customer actively using app)
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log("Foreground message received:", payload);
          const title = payload.notification?.title || payload.data?.title || "Go2Pick Alert";
          const body = payload.notification?.body || payload.data?.message || payload.data?.body || "";

          // Show browser popup native notification even when in-app
          if (Notification.permission === 'granted') {
            try {
              new Notification(title, {
                body,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                data: payload.data
              });
            } catch (e) {
              console.warn("Could not display native notification:", e);
            }
          }
        });

        return () => {
          if (unsubscribe) unsubscribe();
        };

      } catch (err) {
        console.error("Error initializing push notifications:", err);
      }
    }

    if (!initializedRef.current) {
      initializedRef.current = true;
      initPush();
    }
  }, [user, token]);
}
