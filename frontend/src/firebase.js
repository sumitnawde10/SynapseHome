// src/firebase.js

import { initializeApp } from "firebase/app";
// THIS IS THE FIX: Import the functions you need from the auth SDK
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA8RCCNYcZ6nkGksb69RUjlFO1nZhH8m8s",
  authDomain: "synapse-home-project.firebaseapp.com",
  projectId: "synapse-home-project",
  storageBucket: "synapse-home-project.appspot.com", // Corrected this for you
  messagingSenderId: "646302857888",
  appId: "1:646302857888:web:8696e8513ce1d64bbe27c5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();