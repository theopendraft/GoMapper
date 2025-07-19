import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDgJAuuHDw41_dLy7f5EZj841kophQt6mw",
  authDomain: "villagetracker-ef811.firebaseapp.com",
  projectId: "villagetracker-ef811",
  storageBucket: "villagetracker-ef811.appspot.com",
  messagingSenderId: "593452817288",
  appId: "1:593452817288:web:4c66f28186b6eb0e6bb83d",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Utility function to get pins collection for a specific project
export const getProjectPinsCollection = (projectId: string) => {
  return collection(db, "projects", projectId, "pins");
};

// Re-export Firestore functions for convenience
export { collection, doc, setDoc, deleteDoc, onSnapshot };

export { app };