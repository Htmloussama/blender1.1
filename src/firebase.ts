import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

// Config parsed directly from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyBrWSGUTyij3hBL_SJD1ueDV91MPLslJzU",
  authDomain: "ringed-setting-17c1c.firebaseapp.com",
  projectId: "ringed-setting-17c1c",
  storageBucket: "ringed-setting-17c1c.firebasestorage.app",
  messagingSenderId: "185189840311",
  appId: "1:185189840311:web:2794ef475d772f14a8e432"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth & Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

// Test connection to ensure correctness as instructed
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "_internal_", "connection"));
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firebase client is currently offline. Checks may be deferred.");
    }
  }
}

testConnection();
