// ══════════════════════════════════════════════════
// CONEXIÓN A FIREBASE — Panel de administración
// Config del proyecto "silver-cow-admin" (plan Spark, gratis).
// No es secreta: toda app web de Firebase expone este bloque en el
// navegador. Lo que protege los datos son las reglas de seguridad de
// Firestore (ver spec/features/010-vista-admin/plan.md), no este archivo.
// ══════════════════════════════════════════════════
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBZKs04avFbvUwi9oUTIGjoCptI3diNEls",
  authDomain: "silver-cow-admin.firebaseapp.com",
  projectId: "silver-cow-admin",
  messagingSenderId: "618236546317",
  appId: "1:618236546317:web:fc738ba683c06c9a1b3444"
  // storageBucket NO se incluye a propósito: las fotos van por Supabase
  // Storage, no por Firebase Storage (ver sesion-017: Storage de Firebase
  // exige el plan Blaze desde 2026-02-03, se descartó).
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Único correo autorizado a escribir. Esto es solo para la interfaz
// (ocultar/mostrar botones) — la protección real está en las reglas de
// seguridad de Firestore, que repiten esta misma condición del lado del
// servidor y no se pueden burlar editando el JavaScript del navegador.
export const CORREO_ADMIN = "jhetro2005@gmail.com";
