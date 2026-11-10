// ══════════════════════════════════════════════════
// AVISOS DEL PANEL ADMIN + LIMPIEZA DE PEDIDOS VENCIDOS
// Feature 012 (RF-18, RS-13). Plan gratis: sin servidor.
//
// Al entrar el admin:
//  1. Limpieza: borra los pedidos "sin_confirmar" cuyo `expira` ya pasó.
//     (La política TTL de Firestore haría esto sola, pero Google la exige
//     con facturación activa — se comprobó el 2026-11-10: "billing
//     disabled". Por eso lo hace el panel cada vez que se abre.)
//  2. Banner: pedidos nuevos desde la última visita (`avisos/estado.visto`)
//     y cuántos siguen sin confirmar. "Marcar como visto" guarda la fecha.
//  3. En vivo: mientras el panel está abierto, cada pedido nuevo o cambio
//     de estado hecho desde otro lado (otro dispositivo, un cliente) muestra
//     un aviso flotante, suma al contador de la pestaña y al título.
// ══════════════════════════════════════════════════
import {
  collection, query, where, orderBy, limit, getDocs, getDoc, setDoc, doc,
  writeBatch, onSnapshot, Timestamp, serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import { db, auth, CORREO_ADMIN } from "./firebase-config.js";

const ETQ = {
  sin_confirmar: "Sin confirmar", nuevo: "Nuevo", confirmado: "Confirmado", pagado: "Pagado",
  en_camino: "En camino", entregado: "Entregado", cancelado: "Cancelado"
};
const $ = (id) => document.getElementById(id);
const banner = $("avisosBanner");
const toasts = $("avisosToasts");
const tabPedidos = document.querySelector('.admin-secciones [data-seccion="pedidos"]');
const tabVentas = document.querySelector('.admin-secciones [data-seccion="ventas"]');
const tituloBase = document.title;

let pendientesNuevos = 0;   // contador de la pestaña "Pedidos"
let ventasPendientes = 0;   // contador de la pestaña "Ventas" (Fase 5)
let desuscribir = null;
let desuscribirVentas = null;

const usd = (n) => "$" + (Number(n) || 0).toFixed(2);
// Escapa texto antes de meterlo en HTML.
function escapar(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

// Pone el número de pendientes en las pestañas y en el título de la ventana.
function actualizarContador() {
  if (tabPedidos) tabPedidos.textContent = pendientesNuevos ? `Pedidos (${pendientesNuevos})` : "Pedidos";
  if (tabVentas) tabVentas.textContent = ventasPendientes ? `Ventas (${ventasPendientes})` : "Ventas";
  const total = pendientesNuevos + ventasPendientes;
  document.title = total ? `(${total}) ${tituloBase}` : tituloBase;
}

// Abre la pestaña Ventas y la recarga.
function irAVentas() {
  tabVentas?.click();
  document.dispatchEvent(new CustomEvent("admin:ventas-recargar"));
}

// Aviso flotante abajo a la derecha; se cierra solo a los 12 s.
function toast(html) {
  const t = document.createElement("div");
  t.className = "admin-toast";
  t.innerHTML = html + '<button type="button" class="admin-toast-cerrar" aria-label="Cerrar aviso">×</button>';
  t.querySelector(".admin-toast-cerrar").onclick = () => t.remove();
  toasts.appendChild(t);
  setTimeout(() => t.remove(), 12000);
}

// Abre la pestaña Pedidos y la recarga.
function irAPedidos() {
  tabPedidos?.click();
  document.dispatchEvent(new CustomEvent("admin:pedidos-recargar"));
}

// 1. Limpieza de vencidos (solo los que siguen sin confirmar).
async function limpiarVencidos() {
  const snap = await getDocs(query(collection(db, "pedidos"), where("expira", "<", Timestamp.now())));
  const vencidos = snap.docs.filter((d) => d.data().estado === "sin_confirmar");
  for (let i = 0; i < vencidos.length; i += 400) {
    const b = writeBatch(db);
    vencidos.slice(i, i + 400).forEach((d) => b.delete(d.ref));
    await b.commit();
  }
  return vencidos.length;
}

// 2. Banner de lo nuevo desde la última visita.
async function mostrarResumen(borrados) {
  const est = await getDoc(doc(db, "avisos", "estado"));
  const visto = est.exists() && est.data().visto ? est.data().visto : Timestamp.fromMillis(0);
  const [nuevos, sinConf, ventasPend] = await Promise.all([
    getDocs(query(collection(db, "pedidos"), where("creado", ">", visto), orderBy("creado", "desc"), limit(50))),
    getDocs(query(collection(db, "pedidos"), where("estado", "==", "sin_confirmar"))),
    getDocs(query(collection(db, "ventas"), where("estado", "==", "pendiente")))
  ]);
  pendientesNuevos = nuevos.size;
  ventasPendientes = ventasPend.size;
  actualizarContador();

  const partes = [];
  if (nuevos.size) {
    const lista = nuevos.docs.slice(0, 5).map((d) => {
      const p = d.data();
      return `<li><strong>${escapar(p.codigo || d.id)}</strong> — ${usd(p.total)}${p.sellerId ? " · " + escapar(p.sellerId.toUpperCase()) : ""} · ${escapar(ETQ[p.estado] || p.estado)}</li>`;
    }).join("");
    partes.push(`<p><strong>${nuevos.size} pedido${nuevos.size === 1 ? "" : "s"} nuevo${nuevos.size === 1 ? "" : "s"}</strong> desde tu última visita:</p><ul>${lista}</ul>` +
      (nuevos.size > 5 ? `<p>… y ${nuevos.size - 5} más.</p>` : ""));
  }
  if (sinConf.size) partes.push(`<p>${sinConf.size} pedido${sinConf.size === 1 ? "" : "s"} <strong>sin confirmar</strong> (se borran a las 24 h si no los confirmas).</p>`);
  if (ventasPend.size) {
    const porVend = {};
    ventasPend.forEach((d) => { const id = (d.data().sellerId || "?").toUpperCase(); porVend[id] = (porVend[id] || 0) + 1; });
    partes.push(`<p>${ventasPend.size} venta${ventasPend.size === 1 ? "" : "s"} en persona <strong>pendiente${ventasPend.size === 1 ? "" : "s"} de confirmar</strong> (${Object.entries(porVend).map(([k, n]) => `${escapar(k)}: ${n}`).join(", ")}).</p>`);
  }
  if (borrados) partes.push(`<p class="admin-avisos-gris">Se borraron ${borrados} pedido${borrados === 1 ? "" : "s"} sin confirmar que ya tenían más de 24 h.</p>`);
  if (!partes.length) return;

  banner.innerHTML = `<div class="admin-avisos-cuerpo">${partes.join("")}</div>
    <div class="admin-avisos-acciones">
      <button type="button" class="admin-btn-mini" id="avisoVer">Ver pedidos</button>
      ${ventasPend.size ? '<button type="button" class="admin-btn-mini" id="avisoVerVentas">Ver ventas</button>' : ""}
      <button type="button" class="admin-btn-mini" id="avisoVisto">Marcar como visto</button>
    </div>`;
  banner.hidden = false;
  $("avisoVer").onclick = irAPedidos;
  if ($("avisoVerVentas")) $("avisoVerVentas").onclick = irAVentas;
  $("avisoVisto").onclick = marcarVisto;
}

// Guarda la fecha de "visto": el recuadro de la próxima visita muestra solo lo nuevo.
async function marcarVisto() {
  try {
    await setDoc(doc(db, "avisos", "estado"), { visto: serverTimestamp() }, { merge: true });
  } catch (e) { console.error("admin/avisos: visto", e); }
  banner.hidden = true;
  pendientesNuevos = 0; // las ventas pendientes siguen contando hasta que se confirmen
  actualizarContador();
}

// Cuando el admin confirma/cancela una venta pendiente, baja el contador.
document.addEventListener("admin:venta-resuelta", () => {
  ventasPendientes = Math.max(0, ventasPendientes - 1);
  actualizarContador();
});

// Ventas en persona nuevas mientras el panel está abierto (Fase 5).
function escucharVentas() {
  let primera = true;
  desuscribirVentas = onSnapshot(
    query(collection(db, "ventas"), orderBy("fecha", "desc"), limit(20)),
    (snap) => {
      if (primera) { primera = false; return; }
      if (snap.metadata.hasPendingWrites) return;
      snap.docChanges().forEach((ch) => {
        if (ch.type !== "added") return;
        const v = ch.doc.data();
        if (v.estado !== "pendiente") return;
        ventasPendientes++;
        actualizarContador();
        toast(`🧾 <strong>Venta en persona de ${escapar((v.sellerId || "").toUpperCase())}</strong> — ${usd(v.precioFinal)}, pendiente de confirmar
          <button type="button" class="admin-btn-mini admin-toast-ver">Ver</button>`);
        toasts.lastElementChild.querySelector(".admin-toast-ver").onclick = irAVentas;
      });
    },
    (e) => console.error("admin/avisos: ventas en vivo", e)
  );
}

// 3. En vivo mientras el panel está abierto.
function escucharEnVivo() {
  let primera = true;
  desuscribir = onSnapshot(
    query(collection(db, "pedidos"), orderBy("creado", "desc"), limit(20)),
    (snap) => {
      if (primera) { primera = false; return; }  // la primera carga no es "nuevo"
      if (snap.metadata.hasPendingWrites) return; // cambios hechos acá mismo
      snap.docChanges().forEach((ch) => {
        const p = ch.doc.data();
        const cod = escapar(p.codigo || ch.doc.id);
        if (ch.type === "added") {
          pendientesNuevos++;
          actualizarContador();
          toast(`🔔 <strong>Pedido nuevo ${cod}</strong> — ${usd(p.total)}${p.sellerId ? " · " + escapar(p.sellerId.toUpperCase()) : ""}
            <button type="button" class="admin-btn-mini admin-toast-ver">Ver</button>`);
          toasts.lastElementChild.querySelector(".admin-toast-ver").onclick = irAPedidos;
        } else if (ch.type === "modified") {
          toast(`Pedido <strong>${cod}</strong> ahora está: ${escapar(ETQ[p.estado] || p.estado)}`);
        }
      });
    },
    (e) => console.error("admin/avisos: en vivo", e)
  );
}

onAuthStateChanged(auth, async (u) => {
  if (desuscribir) { desuscribir(); desuscribir = null; }
  if (desuscribirVentas) { desuscribirVentas(); desuscribirVentas = null; }
  banner.hidden = true;
  if (!u || u.email !== CORREO_ADMIN) return;
  try {
    const borrados = await limpiarVencidos();
    await mostrarResumen(borrados);
  } catch (e) {
    console.error("admin/avisos", e);
  }
  escucharEnVivo();
  escucharVentas();
});
