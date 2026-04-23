// ============================================
// Firebase Configuration - Centralized
// ============================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getFirestore, 
  addDoc, 
  collection, 
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzQhNztzGFUj8rRca2i7F1w9MMzer-0c",
  authDomain: "raas-dandiya-events-7afe1.firebaseapp.com",
  projectId: "raas-dandiya-events-7afe1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export all Firebase functions and db globally
window.db = db;
window.getFirestore = getFirestore;
window.addDoc = addDoc;
window.collection = collection;
window.getDocs = getDocs;
window.getDoc = getDoc;
window.doc = doc;
window.setDoc = setDoc;
window.updateDoc = updateDoc;

console.log('✓ Firebase initialized globally');
