// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // 1. Add this import

const firebaseConfig = {
  apiKey: "AIzaSyCZV2SnK-c0kZaO5aEXeIw1nvfOCsfvXxc",
  authDomain: "wedding-planning-system-1.firebaseapp.com",
  projectId: "wedding-planning-system-1",
  storageBucket: "wedding-planning-system-1.appspot.com",
  messagingSenderId: "746498188322",
  appId: "1:746498188322:web:1b7fb8161de29b922e167b",
  measurementId: "G-1PJY1K7MQS"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app); // 2. Add this export