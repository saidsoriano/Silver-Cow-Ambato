// ══════════════════════════════════════════════════
// LOGIN DEL PANEL — Google Sign-In + verificación de correo
//
// Dos capas, documentadas en spec/features/010-vista-admin/spec.md:
//  Capa 1 (acá): cualquier cuenta de Google puede abrir sesión.
//  Capa 2 (reglas de Firestore): solo CORREO_ADMIN puede escribir.
// Esta pantalla además rechaza visualmente a cualquier otro correo —
// no porque sea necesario para la seguridad (eso ya lo hacen las
// reglas), sino para no dejar a alguien mirando un panel vacío sin
// explicación.
// ══════════════════════════════════════════════════
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import { auth, CORREO_ADMIN } from "./firebase-config.js";

const pantallaLogin   = document.getElementById("pantallaLogin");
const pantallaPanel   = document.getElementById("pantallaPanel");
const pantallaRechazo = document.getElementById("pantallaRechazo");
const btnLogin        = document.getElementById("btnLogin");
const btnLogout       = document.getElementById("btnLogout");
const btnLogoutRechazo = document.getElementById("btnLogoutRechazo");
const correoRechazo   = document.getElementById("correoRechazo");

function mostrarSolo(pantalla) {
  [pantallaLogin, pantallaPanel, pantallaRechazo].forEach((p) => {
    p.hidden = p !== pantalla;
  });
}

btnLogin.addEventListener("click", async () => {
  btnLogin.disabled = true;
  btnLogin.textContent = "Conectando...";
  try {
    await signInWithPopup(auth, new GoogleAuthProvider());
    // onAuthStateChanged de abajo se encarga de mostrar la pantalla correcta
  } catch (err) {
    console.error("admin/auth: fallo el login", err);
    btnLogin.textContent = "Entrar con Google";
  } finally {
    btnLogin.disabled = false;
  }
});

btnLogout.addEventListener("click", () => signOut(auth));
btnLogoutRechazo.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, (usuario) => {
  if (!usuario) {
    mostrarSolo(pantallaLogin);
    btnLogin.textContent = "Entrar con Google";
    return;
  }
  if (usuario.email !== CORREO_ADMIN) {
    correoRechazo.textContent = usuario.email;
    mostrarSolo(pantallaRechazo);
    return;
  }
  mostrarSolo(pantallaPanel);
});
