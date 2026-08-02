// 1. Importar las funciones necesarias de SDKs de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. Configuración de Firebase para el colegio Gualberto Villarroel
const firebaseConfig = {
  apiKey: "AIzaSyDhCNip2K3eUyN4NUtnCB2Lj0c-VzqDCBI",
  authDomain: "ue-gualberto-v.firebaseapp.com",
  projectId: "ue-gualberto-v",
  storageBucket: "ue-gualberto-v.firebasestorage.app",
  messagingSenderId: "538212569139",
  appId: "1:538212569139:web:5dd7cdd998d48c72325346"
};

// 3. Inicializar Firebase y exportar servicios
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);