// ══════════════════════════════════════════════════
// VENTAS EN PERSONA — sección del panel admin (feature 012, Fase 5)
// RF-13 (confirmar pago), RS-15 (stock), RS-08 (canceladas sin comisión),
// RNF-15 (historial).
//
// - Las registra el vendedor como "pendiente" (js/vendedor/venta.js).
// - El admin revisa precios contra el catálogo y la marca "pagada". En ese
//   momento, cada pieza que estaba "disponible" pasa a "agotado" en
//   `productos/` y deja de venderse en la página (decisión del dueño). Las
//   piezas "bajo pedido" no cambian de estado.
// - Cancelar/devolver una venta ya pagada NO repone el stock solo: si la
//   pieza volvió, se reactiva desde la pestaña Catálogo.
// ══════════════════════════════════════════════════
import {
  collection, query, orderBy, limit, startAfter, getDocs, doc,
  getDoc, writeBatch, serverTimestamp, arrayUnion, Timestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
import { db, auth } from "./firebase-config.js";
import { comision, armarConfig } from "../vendedor/negocio.js";

const POR_PAGINA = 50;
const ESTADOS = [["pendiente", "Pendiente"], ["pagada", "Pagada"], ["cancelada", "Cancelada"], ["devuelta", "Devuelta"]];
const ETQ = Object.fromEntries(ESTADOS);
const PAGO = { efectivo: "Efectivo", transferencia: "Transferencia", tarjeta: "Tarjeta", otro: "Otro" };

const $ = (id) => document.getElementById(id);
const lista = $("listaVentas");
const estadoLista = $("estadoVentasAdm");
const btnMas = $("btnMasVentas");

let ventas = [], ultimo = null, catalogo = {}, cargado = false;
let cfg = armarConfig(); // se reemplaza con config/negocio al cargar

const usd = (n) => "$" + (Number(n) || 0).toFixed(2);
function escapar(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
const fechaDe = (ts) => (ts && typeof ts.toDate === "function" ? ts.toDate() : null);
const claveMes = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

document.addEventListener("admin:seccion", (ev) => { if (ev.detail?.seccion === "ventas" && !cargado) iniciar(); });
document.addEventListener("admin:ventas-recargar", () => { if (cargado) iniciar(); });
$("btnRecargarVen").addEventListener("click", iniciar);
["filtroEstadoVen", "filtroVendedorVen", "filtroMesVen"].forEach((id) => $(id).addEventListener("change", pintar));
btnMas.addEventListener("click", () => cargarPagina(false));

// Carga la sección: catálogo (precios y stock), vendedores, reglas y primera página.
async function iniciar() {
  cargado = true; ventas = []; ultimo = null;
  lista.innerHTML = "";
  estadoLista.hidden = false;
  estadoLista.textContent = "Cargando ventas...";
  try {
    const [prod, vend, conf] = await Promise.all([
      getDocs(collection(db, "productos")), getDocs(collection(db, "vendedores")), getDoc(doc(db, "config", "negocio"))
    ]);
    cfg = armarConfig(conf.exists() ? conf.data() : null);
    catalogo = {};
    prod.forEach((d) => (catalogo[d.id] = d.data()));
    $("filtroVendedorVen").innerHTML = '<option value="">Todos</option>' +
      vend.docs.map((d) => `<option value="${escapar(d.id)}">${escapar(d.data().codigo || d.id)} — ${escapar(d.data().nombre || "")}</option>`).join("");
    await cargarPagina(true);
  } catch (e) {
    console.error("admin/ventas", e);
    estadoLista.textContent = "Error al cargar: " + e.message;
  }
}

// Ventas de a POR_PAGINA, de la más nueva a la más vieja.
async function cargarPagina(primera) {
  const base = [collection(db, "ventas"), orderBy("fecha", "desc")];
  const q = primera || !ultimo ? query(...base, limit(POR_PAGINA)) : query(...base, startAfter(ultimo), limit(POR_PAGINA));
  const snap = await getDocs(q);
  if (snap.docs.length) ultimo = snap.docs[snap.docs.length - 1];
  ventas.push(...snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  btnMas.hidden = snap.docs.length < POR_PAGINA;
  pintar();
}

// Aplica los filtros (estado, vendedor, mes) sobre lo cargado y redibuja.
function pintar() {
  const est = $("filtroEstadoVen").value, ven = $("filtroVendedorVen").value, mes = $("filtroMesVen").value;
  const items = ventas.filter((v) => {
    const f = fechaDe(v.fecha);
    return (!est || v.estado === est) && (!ven || v.sellerId === ven) && (!mes || (f && claveMes(f) === mes));
  });
  lista.innerHTML = "";
  if (!ventas.length) { estadoLista.hidden = false; estadoLista.textContent = "Todavía no hay ventas en persona."; return; }
  if (!items.length) { estadoLista.hidden = false; estadoLista.textContent = "Ninguna venta con esos filtros."; return; }
  estadoLista.hidden = true;
  items.forEach((v) => lista.appendChild(fila(v)));
}

// Avisos antes de confirmar: precios distintos al catálogo, piezas que no existen o
// ya agotadas, descuento de código mal calculado, descuento en dólares a confirmar.
function revisar(v) {
  const avisos = [];
  let suma = 0;
  (v.piezas || []).forEach((p) => {
    suma += (Number(p.precio) || 0) * (Number(p.cantidad) || 0);
    const c = catalogo[p.codigo];
    if (!c) avisos.push(`${p.codigo} no existe en el catálogo.`);
    else {
      if (Math.abs((Number(c.precio) || 0) - (Number(p.precio) || 0)) > 0.009)
        avisos.push(`${p.codigo}: la venta dice ${usd(p.precio)}, el catálogo ${usd(c.precio)}.`);
      if (c.estado === "agotado" && v.estado === "pendiente") avisos.push(`${p.codigo} ya figura agotada en el catálogo.`);
    }
  });
  if (Math.abs(suma - (Number(v.subtotal) || 0)) > 0.009) avisos.push(`El subtotal (${usd(v.subtotal)}) no coincide con las piezas (${usd(suma)}).`);
  if (v.tipoDescuento === "codigo" && Math.abs((Number(v.subtotal) || 0) * cfg.pctCodigo / 100 - (Number(v.descuento) || 0)) > 0.011)
    avisos.push(`El descuento por código no es ${cfg.pctCodigo}% del subtotal.`);
  if (v.tipoDescuento === "monto" && v.descuento > 0) avisos.push(`Descuento en dólares de ${usd(v.descuento)}: confirma que lo aprobaste.`);
  return avisos;
}

// Tarjeta de una venta. Al pasarla a "pagada": confirma, y en el mismo batch las
// piezas que estaban disponibles pasan a "agotado" en la página (RS-15).
function fila(v) {
  const el = document.createElement("div");
  el.className = "admin-fila admin-fila-pedido" + (["cancelada", "devuelta"].includes(v.estado) ? " archivada" : "");
  const f = fechaDe(v.fecha);
  const avisos = revisar(v);
  const stock = (v.piezas || []).filter((p) => catalogo[p.codigo]?.estado === "disponible");
  const desc = v.tipoDescuento === "codigo" ? `código ${cfg.pctCodigo}%` : v.tipoDescuento === "monto" ? "monto aprobado" : "";
  el.innerHTML = `
    <div class="admin-fila-campos">
      <div class="admin-fila-codigo">${escapar((v.sellerId || "").toUpperCase())} · venta en persona</div>
      <div class="admin-vend-dato">${f ? f.toLocaleString("es-EC", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
        · <strong>${escapar(ETQ[v.estado] || v.estado)}</strong> · ${escapar(PAGO[v.metodoPago] || v.metodoPago || "—")}
        ${v.cliente ? " · Cliente: " + escapar(v.cliente) : ""}</div>
      <ul class="admin-pedido-items">
        ${(v.piezas || []).map((p) => `<li><code>${escapar(p.codigo)}</code> ${escapar(p.nombre)} × ${Number(p.cantidad) || 0} — ${usd((Number(p.precio) || 0) * (Number(p.cantidad) || 0))}${p.estadoPieza === "pedido" ? " · bajo pedido" : ""}</li>`).join("")}
      </ul>
      <div class="admin-vend-dato">Subtotal ${usd(v.subtotal)}${v.descuento ? ` · Descuento (${desc}) −${usd(v.descuento)}` : ""}
        · <strong>Total ${usd(v.precioFinal)}</strong> · Comisión ${usd(comision(v.precioFinal, cfg))}${v.estado === "pagada" ? "" : " (si se paga)"}</div>
      ${v.anticipo != null || v.saldo != null ? `<div class="admin-vend-dato">Anticipo ${usd(v.anticipo)} · Saldo ${usd(v.saldo)}</div>` : ""}
      ${avisos.length ? `<div class="admin-pedido-avisos"><strong>Revisar antes de confirmar:</strong><ul>${avisos.map((a) => `<li>${escapar(a)}</li>`).join("")}</ul></div>`
        : `<div class="admin-vend-ok admin-vend-dato">Precios coinciden con el catálogo.</div>`}
      ${v.estado === "pendiente" && stock.length ? `<div class="admin-vend-dato">Al marcarla pagada pasan a <strong>agotado</strong>: ${stock.map((p) => escapar(p.codigo)).join(", ")}</div>` : ""}
    </div>
    <div class="admin-fila-acciones admin-pedido-acciones">
      <select class="admin-select" aria-label="Estado de la venta">
        ${ESTADOS.map(([k, t]) => `<option value="${k}" ${k === v.estado ? "selected" : ""}>${t}</option>`).join("")}
      </select>
      <button type="button" class="admin-btn-mini">Guardar estado</button>
      <span class="admin-fila-ok" hidden>✓</span>
    </div>`;

  const sel = el.querySelector("select"), btn = el.querySelector("button"), ok = el.querySelector(".admin-fila-ok");
  btn.addEventListener("click", async () => {
    const nuevo = sel.value;
    if (nuevo === v.estado) return;
    const aAgotar = nuevo === "pagada" ? stock : [];
    let msg = "";
    if (avisos.length && nuevo === "pagada") msg += "Esta venta tiene puntos para revisar (ver el recuadro). ";
    if (aAgotar.length) msg += `Al marcarla pagada, estas piezas pasan a AGOTADO en la página: ${aAgotar.map((p) => p.codigo).join(", ")}. `;
    if (["cancelada", "devuelta"].includes(nuevo)) msg += `La venta no va a generar comisión.${v.estado === "pagada" ? " El stock no se repone solo: reactiva la pieza en Catálogo si volvió." : ""} `;
    if (msg && !confirm(msg + "¿Continuar?")) return;
    btn.disabled = true;
    try {
      const b = writeBatch(db);
      b.update(doc(db, "ventas", v.id), {
        estado: nuevo,
        actualizado: serverTimestamp(),
        historial: arrayUnion({ estado: nuevo, fecha: Timestamp.now(), por: auth.currentUser?.email || "admin" })
      });
      aAgotar.forEach((p) => b.update(doc(db, "productos", p.codigo), { estado: "agotado", actualizado: serverTimestamp() }));
      await b.commit();
      if (v.estado === "pendiente") document.dispatchEvent(new CustomEvent("admin:venta-resuelta"));
      v.estado = nuevo;
      aAgotar.forEach((p) => { if (catalogo[p.codigo]) catalogo[p.codigo].estado = "agotado"; });
      ok.hidden = false;
      setTimeout(pintar, 900);
    } catch (e) {
      console.error("admin/ventas: estado", e);
      alert("No se pudo cambiar el estado: " + e.message);
    } finally {
      btn.disabled = false;
    }
  });
  return el;
}
