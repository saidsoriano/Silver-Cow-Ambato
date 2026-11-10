// ══════════════════════════════════════════════════
// VENDEDORES — sección del panel admin
// Feature 012-paneles-vendedores, Fase 2 (plan gratis, sin Cloud Functions).
//
// Cada vendedor vive en 3 documentos que se escriben juntos (batch):
//   vendedores/{usuario}  nombre, código, usuario, correo, activo, alta, uid
//   codigos/{CODIGO}      pct, activo, sellerId  → lo consulta el carrito
//   roles/{uid}           role:'vendedor', sellerId, activo → lo leen las
//                         reglas de Firestore para dar acceso al panel
// La cuenta de Firebase Auth (usuario@silvercow.app + contraseña) NO se
// puede crear desde acá sin servidor: el dueño la crea a mano en la consola
// y pega el UID. Desactivar corta el acceso y el descuento al instante.
// ══════════════════════════════════════════════════
import {
  collection, doc, getDoc, getDocs, writeBatch, serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

const DOMINIO = "silvercow.app";
const PCT_CODIGO = 5; // RS-01. Pasa a config/negocio en la Fase 6.

// ── Selector de sección (Catálogo | Vendedores) ──
const titulo = document.getElementById("tituloSeccion");
const secciones = {
  catalogo: document.getElementById("seccionCatalogo"),
  vendedores: document.getElementById("seccionVendedores"),
  pedidos: document.getElementById("seccionPedidos"),
  ventas: document.getElementById("seccionVentas"),
  comisiones: document.getElementById("seccionComisiones")
};
const botonesSeccion = document.querySelectorAll(".admin-secciones .admin-tab");
let vendedoresCargados = false;

botonesSeccion.forEach((btn) => {
  btn.addEventListener("click", () => {
    const sec = btn.dataset.seccion;
    botonesSeccion.forEach((b) => {
      const activa = b === btn;
      b.classList.toggle("activa", activa);
      b.setAttribute("aria-selected", activa ? "true" : "false");
    });
    // Se oculta, no se destruye: lo editado en el catálogo no se pierde.
    Object.entries(secciones).forEach(([k, el]) => (el.hidden = k !== sec));
    titulo.textContent = btn.textContent.replace(/\s*\(\d+\)$/, ""); // sin el contador de avisos
    if (sec === "vendedores" && !vendedoresCargados) cargarVendedores();
    // pedidos.js escucha este evento para cargar su lista al abrirse
    document.dispatchEvent(new CustomEvent("admin:seccion", { detail: { seccion: sec } }));
  });
});

// ── Utilidades ──
function escapar(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

// "Doménica" → "DOMENICA". Solo A-Z y 0-9, máx. 12 caracteres.
// Escape explícito del rango de acentos (no el carácter literal: se
// corrompe al guardar, ver sesión 027).
function codigoDesdeNombre(nombre) {
  return String(nombre || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 12);
}

// RS-19: el código no se repite. Si DOME ya existe, prueba DOME2, DOME3...
async function codigoLibre(base) {
  for (let n = 1; n <= 9; n++) {
    const cand = n === 1 ? base : base.slice(0, 11) + n;
    const [v, c] = await Promise.all([
      getDoc(doc(db, "vendedores", cand.toLowerCase())),
      getDoc(doc(db, "codigos", cand))
    ]);
    if (!v.exists() && !c.exists()) return cand;
  }
  throw new Error("No se encontró un código libre para ese nombre.");
}

// Los UID de Firebase Auth son alfanuméricos (normalmente 28 caracteres).
function uidValido(uid) {
  return /^[A-Za-z0-9]{20,128}$/.test(uid);
}

// Fecha corta para la lista (ej. 10 nov 2026).
function fecha(ts) {
  if (!ts || typeof ts.toDate !== "function") return "—";
  return ts.toDate().toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Formulario de alta ──
const btnAbrir = document.getElementById("btnAbrirVendedor");
const btnCerrar = document.getElementById("btnCerrarVendedor");
const form = document.getElementById("formVendedor");
const inNombre = document.getElementById("vendNombre");
const inUid = document.getElementById("vendUid");
const inCodigo = document.getElementById("vendCodigo");
const preview = document.getElementById("vendCodigoPreview");
const ayuda = document.getElementById("vendAyuda");
const estadoForm = document.getElementById("estadoVendedor");
const btnGuardar = document.getElementById("btnGuardarVendedor");

// El código sale de la PRIMERA palabra del nombre ("Doménica Pico" → DOMENICA)
// mientras el admin no lo edite a mano; si lo edita, se respeta lo suyo.
let codigoEditado = false;
function sugerirCodigo() {
  if (codigoEditado) return;
  inCodigo.value = codigoDesdeNombre(inNombre.value.trim().split(/\s+/)[0]);
}

// Muestra el código y usuario que se van a crear, y los pasos para crear la cuenta.
function actualizarPreview() {
  const cod = codigoDesdeNombre(inCodigo.value);
  if (!cod) {
    preview.textContent = "";
    ayuda.textContent = "";
    return;
  }
  const usuario = cod.toLowerCase();
  preview.textContent = `Código de descuento: ${cod} · Usuario: ${usuario}`;
  ayuda.textContent =
    `Para que pueda entrar a su panel: en Firebase → Authentication → Agregar usuario, ` +
    `creá ${usuario}@${DOMINIO} con una contraseña, copiá el UID que aparece y pegalo arriba ` +
    `(o después, en la lista).`;
}

btnAbrir.addEventListener("click", () => {
  form.hidden = false;
  btnAbrir.hidden = true;
  inNombre.focus();
});
btnCerrar.addEventListener("click", cerrarForm);
inNombre.addEventListener("input", () => { sugerirCodigo(); actualizarPreview(); });
inCodigo.addEventListener("input", () => {
  codigoEditado = inCodigo.value.trim() !== "";
  const limpio = codigoDesdeNombre(inCodigo.value);
  if (limpio !== inCodigo.value) inCodigo.value = limpio; // solo A-Z y 0-9, en mayúsculas
  actualizarPreview();
});

// Cierra el formulario de alta; si hay algo escrito, pregunta antes.
function cerrarForm() {
  if ((inNombre.value.trim() || inCodigo.value.trim() || inUid.value.trim()) &&
      !confirm("Vas a perder lo que escribiste. ¿Cerrar igual?")) return;
  form.reset();
  codigoEditado = false;
  actualizarPreview();
  estadoForm.hidden = true;
  form.hidden = true;
  btnAbrir.hidden = false;
}

// Mensaje de resultado (verde si salió bien, rojo si hubo error).
function mostrarEstado(el, msg, error) {
  el.hidden = false;
  el.textContent = msg;
  el.className = error ? "admin-alta-error" : "admin-alta-ok";
}

// Alta: crea vendedores/{usuario} + codigos/{CODIGO} (+ roles/{uid} si se pegó el UID)
// en un solo batch: o se guardan los tres, o ninguno.
form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const nombre = inNombre.value.trim();
  const uid = inUid.value.trim();
  const base = codigoDesdeNombre(inCodigo.value);
  if (!nombre) return mostrarEstado(estadoForm, "Escribí el nombre del vendedor.", true);
  if (!base) return mostrarEstado(estadoForm, "El código necesita al menos una letra (solo A-Z y 0-9).", true);
  if (uid && uid.includes("@")) return mostrarEstado(estadoForm, "Eso es el correo, no el UID. El UID es el código largo de la columna \"UID de usuario\" en Authentication. Podés dejarlo vacío por ahora.", true);
  if (uid && !uidValido(uid)) return mostrarEstado(estadoForm, "Ese UID no parece válido. Copialo de nuevo desde Authentication.", true);

  btnGuardar.disabled = true;
  try {
    if (uid && (await getDoc(doc(db, "roles", uid))).exists()) {
      throw new Error("Ese UID ya está vinculado a otro vendedor.");
    }
    const codigo = await codigoLibre(base);
    if (codigo !== base && !confirm(`El código ${base} ya existe. ¿Usar ${codigo} en su lugar?`)) {
      btnGuardar.disabled = false;
      return;
    }
    const id = codigo.toLowerCase();
    const batch = writeBatch(db);
    batch.set(doc(db, "vendedores", id), {
      nombre, codigo, usuario: id, correo: `${id}@${DOMINIO}`,
      activo: true, uid: uid || null, alta: serverTimestamp()
    });
    batch.set(doc(db, "codigos", codigo), { pct: PCT_CODIGO, activo: true, sellerId: id });
    if (uid) batch.set(doc(db, "roles", uid), { role: "vendedor", sellerId: id, activo: true });
    await batch.commit();

    mostrarEstado(estadoForm, `Listo — ${nombre} (${codigo}) agregado.`, false);
    form.reset();
    codigoEditado = false;
    actualizarPreview();
    cargarVendedores();
    setTimeout(() => { estadoForm.hidden = true; form.hidden = true; btnAbrir.hidden = false; }, 1800);
  } catch (err) {
    console.error("admin/vendedores: alta", err);
    mostrarEstado(estadoForm, "No se pudo guardar: " + err.message, true);
  } finally {
    btnGuardar.disabled = false;
  }
});

// ── Lista ──
const lista = document.getElementById("listaVendedores");
const estadoLista = document.getElementById("estadoVendedores");

// Lista todos los vendedores, ordenados por nombre.
async function cargarVendedores() {
  lista.innerHTML = "";
  estadoLista.hidden = false;
  estadoLista.textContent = "Cargando...";
  try {
    const snap = await getDocs(collection(db, "vendedores"));
    vendedoresCargados = true;
    if (snap.empty) {
      estadoLista.textContent = "Todavía no hay vendedores. Agregá el primero con el botón de arriba.";
      return;
    }
    estadoLista.hidden = true;
    snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), "es"))
      .forEach((v) => lista.appendChild(filaVendedor(v)));
  } catch (err) {
    console.error("admin/vendedores: cargar", err);
    estadoLista.textContent = "Error al cargar: " + err.message;
  }
}

// Tarjeta de un vendedor con sus acciones: editar nombre, vincular/cambiar UID,
// desactivar/reactivar.
function filaVendedor(v) {
  const fila = document.createElement("div");
  fila.className = "admin-fila admin-fila-vendedor" + (v.activo ? "" : " archivada");
  const cuenta = v.uid
    ? `<span class="admin-vend-ok">Cuenta vinculada</span> <code>${escapar(v.uid)}</code>`
    : `<span class="admin-vend-pendiente">Sin cuenta vinculada</span> — no puede entrar a su panel todavía`;

  fila.innerHTML = `
    <div class="admin-fila-campos">
      <div class="admin-fila-codigo">${escapar(v.codigo)}</div>
      <div class="admin-vend-nombre">${escapar(v.nombre)}</div>
      <div class="admin-vend-dato">Usuario: <strong>${escapar(v.usuario)}</strong> · ${escapar(v.correo)}</div>
      <div class="admin-vend-dato">Estado: <strong>${v.activo ? "Activo" : "Inactivo"}</strong> · Alta: ${fecha(v.alta)}</div>
      <div class="admin-vend-dato">${cuenta}</div>
      <div class="admin-vend-vincular">
        <input class="admin-input admin-input-uid" type="text" maxlength="128"
               placeholder="${v.uid ? "Cambiar UID (si se rehízo la cuenta)" : "Pegá el UID de Authentication"}">
        <button type="button" class="admin-btn-mini admin-btn-vincular">${v.uid ? "Cambiar" : "Vincular"}</button>
      </div>
    </div>
    <div class="admin-fila-acciones">
      <button type="button" class="admin-btn-mini admin-btn-nombre">Editar nombre</button>
      <button type="button" class="admin-btn-mini admin-btn-estado">${v.activo ? "Desactivar" : "Reactivar"}</button>
      <span class="admin-fila-ok" hidden>✓</span>
    </div>`;

  const btnEstado = fila.querySelector(".admin-btn-estado");
  const btnNombre = fila.querySelector(".admin-btn-nombre");

  // Solo cambia el nombre que se muestra; el código y el usuario no cambian
  // (los clientes y el login dependen de ellos).
  btnNombre.addEventListener("click", async () => {
    const nuevo = (prompt(`Nuevo nombre para ${v.codigo}:`, v.nombre || "") || "").trim();
    if (!nuevo || nuevo === v.nombre) return;
    if (nuevo.length > 60) return alert("Máximo 60 caracteres.");
    btnNombre.disabled = true;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "vendedores", v.id), { nombre: nuevo });
      await batch.commit();
      cargarVendedores();
    } catch (err) {
      console.error("admin/vendedores: nombre", err);
      alert("No se pudo cambiar el nombre: " + err.message);
      btnNombre.disabled = false;
    }
  });
  const btnVincular = fila.querySelector(".admin-btn-vincular");
  const inputUid = fila.querySelector(".admin-input-uid");
  const ok = fila.querySelector(".admin-fila-ok");

  // RS-20: desactivar = sin acceso al panel y su código deja de dar
  // descuento. El historial se conserva (no se borra nada).
  btnEstado.addEventListener("click", async () => {
    const nuevo = !v.activo;
    if (!nuevo && !confirm(
      `¿Desactivar a ${v.nombre}? No va a poder entrar a su panel y su código ${v.codigo} ` +
      `deja de dar descuento. Su historial se conserva. Para cortar también el login, ` +
      `deshabilitá la cuenta en Firebase → Authentication.`)) return;
    btnEstado.disabled = true;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "vendedores", v.id), { activo: nuevo });
      batch.set(doc(db, "codigos", v.codigo), { pct: PCT_CODIGO, activo: nuevo, sellerId: v.id }, { merge: true });
      if (v.uid) batch.set(doc(db, "roles", v.uid), { role: "vendedor", sellerId: v.id, activo: nuevo }, { merge: true });
      await batch.commit();
      cargarVendedores();
    } catch (err) {
      console.error("admin/vendedores: estado", err);
      alert("No se pudo cambiar el estado: " + err.message);
      btnEstado.disabled = false;
    }
  });

  btnVincular.addEventListener("click", async () => {
    const uid = inputUid.value.trim();
    if (!uidValido(uid)) return alert("Ese UID no parece válido. Copialo de nuevo desde Firebase → Authentication.");
    if (uid === v.uid) return;
    btnVincular.disabled = true;
    try {
      const existente = await getDoc(doc(db, "roles", uid));
      if (existente.exists() && existente.data().sellerId !== v.id) {
        throw new Error("Ese UID ya está vinculado a otro vendedor.");
      }
      const batch = writeBatch(db);
      if (v.uid) batch.delete(doc(db, "roles", v.uid)); // la cuenta vieja pierde acceso
      batch.set(doc(db, "roles", uid), { role: "vendedor", sellerId: v.id, activo: !!v.activo });
      batch.update(doc(db, "vendedores", v.id), { uid });
      await batch.commit();
      ok.hidden = false;
      setTimeout(cargarVendedores, 900);
    } catch (err) {
      console.error("admin/vendedores: vincular", err);
      alert("No se pudo vincular: " + err.message);
    } finally {
      btnVincular.disabled = false;
    }
  });

  return fila;
}
