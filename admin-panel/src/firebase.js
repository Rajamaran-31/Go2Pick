import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getMessaging, isSupported } from 'firebase/messaging';

export const firebaseConfig = {
  apiKey: "AIzaSyC-yVxjHB9_sKuKPUsRv-x_yDXEudxnTII",
  authDomain: "go2pick-345bf.firebaseapp.com",
  projectId: "go2pick-345bf",
  storageBucket: "go2pick-345bf.firebasestorage.app",
  messagingSenderId: "612734922695",
  appId: "1:612734922695:web:c266bc6c0bdd6fd9f373e2",
  measurementId: "G-F8H2FV2HRX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);

let messaging = null;
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
  }
}).catch((err) => {
  console.warn("Firebase Messaging not supported in this environment:", err);
});

export { messaging };
export default app;
