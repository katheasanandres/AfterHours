import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCd6AirFdF5N-X6kr2-7LsE6KfGwwCNqHQ",
  authDomain: "afterhours-72594.firebaseapp.com",
  projectId: "afterhours-72594",
  storageBucket: "afterhours-72594.firebasestorage.app",
  messagingSenderId: "908996951821",
  appId: "1:908996951821:web:064742a01752f5c1d4fa44",
  measurementId: "G-ZS3C9WES0B"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);