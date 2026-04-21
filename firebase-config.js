import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAExPxIkQ3JIuy9Og8InjbknkcJ9Hqb_MA",
  authDomain: "the-archery-of-world.firebaseapp.com",
  databaseURL: "https://the-archery-of-world.firebaseio.com",
  projectId: "the-archery-of-world",
  storageBucket: "the-archery-of-world.firebasestorage.app",
  messagingSenderId: "559934106271",
  appId: "1:559934106271:web:8bfdfbddbdfc69a60450aa",
  measurementId: "G-0XV1M89HZN"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
