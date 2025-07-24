// src/services/firebase.ts (Revised with NEW Firebase Config & new collection helpers)

import { initializeApp } from "firebase/app";
import { 
    getFirestore, 
    collection, 
    doc, 
    setDoc, 
    deleteDoc, 
    onSnapshot,
    query, // NEW: Import query
    where // NEW: Import where
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {

  apiKey: "AIzaSyB65Lm1zmRbPPp4_u7ICJ-5S8xp5QIb7c8",
  authDomain: "gomapper-7b6e2.firebaseapp.com",
  projectId: "gomapper-7b6e2",
  storageBucket: "gomapper-7b6e2.firebasestorage.app",
  messagingSenderId: "328794470167",
  appId: "1:328794470167:web:292b58e6a51c058862e952",
  measurementId: "G-RECPK4RB56"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// NEW: Utility functions for new user/project-specific data model
// This will get the collection of projects for a specific user
export const getUserProjectsCollection = (userId: string) => {
    return collection(db, "users", userId, "projects");
};

// This will get the collection of pins for a specific project within a user's data
export const getProjectPinsCollection = (userId: string, projectId: string) => {
    return collection(db, "users", userId, "projects", projectId, "pins");
};

// Re-export Firestore functions for convenience
export { collection, doc, setDoc, deleteDoc, onSnapshot, query, where }; // Also export query, where

export { app };

// // src/services/firebase.ts (Revised)
// import { initializeApp } from "firebase/app";
// import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, query, where } from "firebase/firestore"; // Add query, where
// import { getAuth } from "firebase/auth";

// const firebaseConfig = {

//   apiKey: "AIzaSyB65Lm1zmRbPPp4_u7ICJ-5S8xp5QIb7c8",
//   authDomain: "gomapper-7b6e2.firebaseapp.com",
//   projectId: "gomapper-7b6e2",
//   storageBucket: "gomapper-7b6e2.firebasestorage.app",
//   messagingSenderId: "328794470167",
//   appId: "1:328794470167:web:292b58e6a51c058862e952",
//   measurementId: "G-RECPK4RB56"
// };

// const app = initializeApp(firebaseConfig);
// export const db = getFirestore(app);
// export const auth = getAuth(app);

// // NEW: Utility functions for new data model
// export const getUserProjectsCollection = (userId: string) => {
//   return collection(db, "users", userId, "projects");
// };

// export const getProjectPinsCollection = (userId: string, projectId: string) => {
//   return collection(db, "users", userId, "projects", projectId, "pins");
// };

// // Re-export Firestore functions for convenience
// export { collection, doc, setDoc, deleteDoc, onSnapshot, query, where }; // Also export query, where for convenience

// export { app };