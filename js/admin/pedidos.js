// ══════════════════════════════════════════════════
// PEDIDOS WEB — sección del panel admin (feature 012, Fase 4)
// RF-12 (ver, filtrar), RF-13 (cambiar estado), RNF-15 (historial).
//
// - Validación de precios (decisión 2 de la spec): se compara cada pieza del
//   pedido contra `productos/{codigo}` y se marca cualquier diferencia antes
//   de que el admin lo confirme. La web no puede validarlo por sí sola.
// - Al sacar un pedido de "sin_confirmar" se borra `expira`, así la política
//   TTL de 24 h ya no lo elimina.
// - Si el pedido usó código de vendedor, se escribe/actualiza el espejo
//   `pedidos_vendedor/{codigo}` con solo número, monto, estado y fecha (RS-17).
// ══════════════════════════════════════════════════
import {
  collection, query, orderBy, limit, startAfter, getDocs, doc,
  writeBatch, serverTimestamp, deleteField, arrayUnion, Timestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
import { db, auth } from "./firebase-config.js";

const POR_PAGINA = 50;
const ESTADOS = [
  ["sin_confirmar", "Sin confirmar"], ["nuevo", "Nuevo"], ["confirmado", "Confirmado"],
  ["pagado", "Pagado"], ["en_camino", "En camino"], ["entregado", "Entregado"],
  ["cancelado", "Cancelado"]
];
const ETQ = Object.fromEntries(ESTADOS);

const $ = (id) => document.getElementById(id);
const lista = $("listaPedidos");
const estadoLista = $("estadoPedidos");
const btnMas = $("btnMasPedidos");

let pedidos = [];          // todo lo cargado (se filtra en el navegador)
let ultimo = null;         // cursor para "Cargar más"
let catalogo = null;       // codigo → { precio, nombre }
let cargado = false;

const usd = (n) => "$" + (Number(n) || 0).toFixed(2);
function escapar(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
const fechaDe = (ts) => (ts && typeof ts.toDate === "function" ? ts.toDate() : null);
const claveMes = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

document.addEventListener("admin:seccion", (ev) => {
  if (ev.detail?.seccion === "pedidos" && !cargado) iniciar();
});
$("btnRecargarPed").addEventListener("click", iniciar);
// avisos.js pide recargar cuando llega un pedido nuevo con la lista abierta
document.addEventListener("admin:pedidos-recargar", () => { if (cargado) iniciar(); });
["filtroEstadoPed", "filtroVendedorPed", "filtroMesPed"].forEach((id) =>
  $(id).addEventListener("change", pintar));
btnMas.addEventListener("click", () => cargarPagina(false));

// Carga (o recarga) la sección: catálogo para comparar precios, vendedores para el
// filtro y la primera página de pedidos.
async function iniciar() {
  cargado = true;
  pedidos = [];
  ultimo = null;
  lista.innerHTML = "";
  estadoLista.hidden = false;
  estadoLista.textContent = "Cargando pedidos...";
  try {
    await Promise.all([cargarCatalogo(), cargarVendedoresFiltro()]);
    await cargarPagina(true);
  } catch (e) {
    console.error("admin/pedidos", e);
    estadoLista.textContent = "Error al cargar: " + e.message;
  }
}

// Precios actuales de cada pieza, para avisar si el pedido trae otro precio.
async function cargarCatalogo() {
  const snap = await getDocs(collection(db, "productos"));
  catalogo = {};
  snap.forEach((d) => (catalogo[d.id] = { precio: d.data().precio, nombre: d.data().nombre, archivado: d.data().archivado }));
}

// Llena el selector "Vendedor" del filtro.
async function cargarVendedoresFiltro() {
  const sel = $("filtroVendedorPed");
  const snap = await getDocs(collection(db, "vendedores"));
  sel.innerHTML = '<option value="">Todos</option><option value="-">Sin código</option>' +
    snap.docs.map((d) => `<option value="${escapar(d.id)}">${escapar(d.data().codigo || d.id)} — ${escapar(d.data().nombre || "")}</option>`).join("");
}

// Trae pedidos de a POR_PAGINA, del más nuevo al más viejo ("Cargar más" sigue desde el último).
async function cargarPagina(primera) {
  const q = primera || !ultimo
    ? query(collection(db, "pedidos"), orderBy("creado", "desc"), limit(POR_PAGINA))
    : query(collection(db, "pedidos"), orderBy("creado", "desc"), startAfter(ultimo), limit(POR_PAGINA));
  const snap = await getDocs(q);
  if (snap.docs.length) ultimo = snap.docs[snap.docs.length - 1];
  pedidos.push(...snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  btnMas.hidden = snap.docs.length < POR_PAGINA;
  pintar();
}

// Filtra lo ya cargado por estado, vendedor y mes (sin volver a consultar Firestore).
function filtrados() {
  const est = $("filtroEstadoPed").value;
  const ven = $("filtroVendedorPed").value;
  const mes = $("filtroMesPed").value;
  return pedidos.filter((p) => {
    if (est && p.estado !== est) return false;
    if (ven === "-" && p.sellerId) return false;
    if (ven && ven !== "-" && p.sellerId !== ven) return false;
    const f = fechaDe(p.creado);
    if (mes && (!f || claveMes(f) !== mes)) return false;
    return true;
  });
}

// Diferencias entre lo que dice el pedido y el catálogo actual.
function revisarPrecios(p) {
  const avisos = [];
  let suma = 0;
  (p.items || []).forEach((it) => {
    suma += (Number(it.precio) || 0) * (Number(it.cantidad) || 0);
    const c = catalogo && catalogo[it.codigo];
    if (!it.codigo) avisos.push(`"${it.nombre}" no trae código.`);
    else if (!c) avisos.push(`${it.codigo} no existe en el catálogo.`);
    else if (Math.abs((Number(c.precio) || 0) - (Number(it.precio) || 0)) > 0.009)
      avisos.push(`${it.codigo}: el pedido dice ${usd(it.precio)}, el catálogo ${usd(c.precio)}.`);
  });
  if (Math.abs(suma - (Number(p.subtotal) || 0)) > 0.009)
    avisos.push(`El subtotal (${usd(p.subtotal)}) no coincide con la suma de las piezas (${usd(suma)}).`);
  return avisos;
}

// Redibuja la lista según los filtros.
function pintar() {
  const items = filtrados();
  lista.innerHTML = "";
  if (!pedidos.length) {
    estadoLista.hidden = false;
    estadoLista.textContent = "Todavía no hay pedidos de la web.";
    return;
  }
  if (!items.length) {
    estadoLista.hidden = false;
    estadoLista.textContent = "Ningún pedido con esos filtros.";
    return;
  }
  estadoLista.hidden = true;
  items.forEach((p) => lista.appendChild(filaPedido(p)));
}

// Tarjeta de un pedido: piezas, totales, avisos de precio y selector de estado.
// Guardar estado: actualiza el pedido + historial, borra `expira` si sale de
// "sin confirmar" y actualiza el espejo que ve el vendedor.
function filaPedido(p) {
  const fila = document.createElement("div");
  fila.className = "admin-fila admin-fila-pedido" + (p.estado === "cancelado" ? " archivada" : "");
  const f = fechaDe(p.creado);
  const avisos = revisarPrecios(p);
  const vence = fechaDe(p.expira);
  const horas = vence ? Math.max(0, Math.round((vence - Date.now()) / 3600000)) : null;

  fila.innerHTML = `
    <div class="admin-fila-campos">
      <div class="admin-fila-codigo">${escapar(p.codigo || p.id)}</div>
      <div class="admin-vend-dato">
        ${f ? f.toLocaleString("es-EC", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
        · <strong>${escapar(ETQ[p.estado] || p.estado)}</strong>
        ${p.estado === "sin_confirmar" && horas !== null ? ` · se borra en ~${horas} h si no se confirma` : ""}
      </div>
      <div class="admin-vend-dato">Vendedor: <strong>${p.sellerId ? escapar(p.sellerId.toUpperCase()) : "sin código"}</strong>
        · Envío: ${escapar(p.envio?.tipo === "otra" ? "otra ciudad" : "Ambato")}</div>
      <ul class="admin-pedido-items">
        ${(p.items || []).map((it) => `<li><code>${escapar(it.codigo)}</code> ${escapar(it.nombre)} × ${Number(it.cantidad) || 0} — ${usd((Number(it.precio) || 0) * (Number(it.cantidad) || 0))}${it.esPedido ? " · bajo pedido" : ""}</li>`).join("")}
      </ul>
      <div class="admin-vend-dato">Subtotal ${usd(p.subtotal)}${p.descuento ? ` · Descuento −${usd(p.descuento)}` : ""}${p.envio?.costo ? ` · Envío ${usd(p.envio.costo)}` : ""} · <strong>Total ${usd(p.total)}</strong></div>
      ${avisos.length ? `<div class="admin-pedido-avisos"><strong>Revisar antes de confirmar:</strong><ul>${avisos.map((a) => `<li>${escapar(a)}</li>`).join("")}</ul></div>` : `<div class="admin-vend-ok admin-vend-dato">Precios coinciden con el catálogo.</div>`}
    </div>
    <div class="admin-fila-acciones admin-pedido-acciones">
      <select class="admin-select admin-pedido-estado" aria-label="Estado del pedido ${escapar(p.codigo || p.id)}">
        ${ESTADOS.filter(([v]) => v !== "sin_confirmar" || p.estado === "sin_confirmar")
          .map(([v, t]) => `<option value="${v}" ${v === p.estado ? "selected" : ""}>${t}</option>`).join("")}
      </select>
      <button type="button" class="admin-btn-mini admin-btn-guardar-estado">Guardar estado</button>
      <span class="admin-fila-ok" hidden>✓</span>
    </div>`;

  const sel = fila.querySelector(".admin-pedido-estado");
  const btn = fila.querySelector(".admin-btn-guardar-estado");
  const ok = fila.querySelector(".admin-fila-ok");

  btn.addEventListener("click", async () => {
    const nuevo = sel.value;
    if (nuevo === p.estado) return;
    if (p.estado === "sin_confirmar" && avisos.length &&
        !confirm("Este pedido tiene diferencias con el catálogo (ver \"Revisar antes de confirmar\"). ¿Cambiar el estado igual?")) return;
    if (nuevo === "cancelado" && !confirm(`¿Cancelar el pedido ${p.codigo || p.id}? No genera comisión.`)) return;
    btn.disabled = true;
    try {
      const batch = writeBatch(db);
      const cambio = {
        estado: nuevo,
        actualizado: serverTimestamp(),
        historial: arrayUnion({ estado: nuevo, fecha: Timestamp.now(), por: auth.currentUser?.email || "admin" })
      };
      if (p.estado === "sin_confirmar") cambio.expira = deleteField(); // ya no lo borra el TTL
      batch.update(doc(db, "pedidos", p.id), cambio);
      if (p.sellerId) {
        batch.set(doc(db, "pedidos_vendedor", p.id), {
          sellerId: p.sellerId, codigo: p.codigo || p.id, monto: Number(p.total) || 0,
          estado: nuevo, fecha: p.creado || serverTimestamp()
        }, { merge: true });
      }
      await batch.commit();
      p.estado = nuevo;
      if (cambio.expira) delete p.expira;
      ok.hidden = false;
      setTimeout(pintar, 900);
    } catch (e) {
      console.error("admin/pedidos: estado", e);
      alert("No se pudo cambiar el estado: " + e.message);
    } finally {
      btn.disabled = false;
    }
  });
  return fila;
}
