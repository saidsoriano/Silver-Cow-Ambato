// ══════════════════════════════════════════════════
// EXPORTAR A EXCEL — feature 012, Fase 7 (RF-19, RNF-15)
// Un .xlsx con 6 hojas: Pedidos web, Ventas en persona, Historial de
// estados, Comisiones por mes, Pagos y Vendedores. Filtrable por vendedor y
// por "todo el historial" o el mes elegido. Se genera en el navegador y se
// descarga: no se guarda ningún archivo (RF-19).
// Para la trazabilidad que pida un vendedor: cada cambio de estado de sus
// pedidos y ventas, con fecha, hora y quién lo hizo.
//
// SheetJS se importa recién al tocar "Descargar" (no al abrir el panel):
// si el CDN fallara, solo falla la exportación, no todo el panel (misma
// lección que el bug de Supabase, sesión 030). Versión oficial 0.20.3 de
// cdn.sheetjs.com (la 0.18.5 de npm tiene fallas de seguridad conocidas).
// ══════════════════════════════════════════════════
import { collection, getDocs, getDoc, doc } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { armarConfig, conValoresBono, comision, resumenMes, margenMes, claveMes } from "../vendedor/negocio.js";

const XLSX_URL = "https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs";
const $ = (id) => document.getElementById(id);
const aFecha = (ts) => (ts && typeof ts.toDate === "function" ? ts.toDate() : null);
const fmt = (d) => (d ? d.toLocaleString("es-EC", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "");
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const ETQ = {
  sin_confirmar: "Sin confirmar", nuevo: "Nuevo", confirmado: "Confirmado", pagado: "Pagado",
  en_camino: "En camino", entregado: "Entregado", cancelado: "Cancelado",
  pendiente: "Pendiente", pagada: "Pagada", cancelada: "Cancelada", devuelta: "Devuelta"
};

// Llena el selector de vendedores cuando se abre la sección.
document.addEventListener("admin:seccion", async (ev) => {
  if (ev.detail?.seccion !== "comisiones" || $("expVendedor").options.length > 1) return;
  try {
    const v = await getDocs(collection(db, "vendedores"));
    v.docs.sort((a, b) => String(a.data().nombre).localeCompare(String(b.data().nombre), "es")).forEach((d) => {
      const o = document.createElement("option");
      o.value = d.id;
      o.textContent = `${d.data().codigo || d.id} — ${d.data().nombre || ""}`;
      $("expVendedor").appendChild(o);
    });
  } catch (e) { console.error("admin/exportar: vendedores", e); }
});

$("btnExportar").addEventListener("click", exportar);

// Lee todo de Firestore, arma las 6 hojas según los filtros y descarga el .xlsx.
async function exportar() {
  const est = $("expEstado");
  const btn = $("btnExportar");
  const vendedor = $("expVendedor").value;
  const soloMes = $("expPeriodo").value === "mes" ? ($("mesComisiones").value || claveMes()) : null;
  est.hidden = false;
  est.className = "";
  est.textContent = "Preparando el archivo...";
  btn.disabled = true;
  try {
    const XLSX = await import(XLSX_URL);
    const [vend, ventas, pedidos, pagos, resumenes, costosSnap, conf] = await Promise.all([
      getDocs(collection(db, "vendedores")), getDocs(collection(db, "ventas")), getDocs(collection(db, "pedidos")),
      getDocs(collection(db, "pagos")), getDocs(collection(db, "resumenes")), getDocs(collection(db, "costos")),
      getDoc(doc(db, "config", "negocio"))
    ]);
    const priv = await getDoc(doc(db, "config", "privado"));
    const cfg = conValoresBono(armarConfig(conf.exists() ? conf.data() : null), priv.exists() ? priv.data() : null);
    const costos = {};
    costosSnap.forEach((d) => (costos[d.id] = d.data().costo));
    const vendedores = Object.fromEntries(vend.docs.map((d) => [d.id, d.data()]));
    const nombre = (id) => (id ? `${vendedores[id]?.codigo || id.toUpperCase()} (${vendedores[id]?.nombre || ""})` : "Sin código");
    const pasa = (sellerId, fecha) => (!vendedor || sellerId === vendedor) && (!soloMes || (fecha && claveMes(fecha) === soloMes));
    const piezasTxt = (arr) => (arr || []).map((p) => `${p.codigo} ${p.nombre || ""} ×${p.cantidad} @ $${r2(p.precio).toFixed(2)}`).join("; ");

    // Hoja 1 — Pedidos web
    const hojaPedidos = [];
    const historial = [];
    pedidos.forEach((d) => {
      const p = d.data(), f = aFecha(p.creado);
      if (!pasa(p.sellerId, f)) return;
      hojaPedidos.push({
        "Código": p.codigo || d.id, "Fecha": fmt(f), "Vendedor": nombre(p.sellerId), "Estado": ETQ[p.estado] || p.estado,
        "Piezas": piezasTxt(p.items), "Subtotal": r2(p.subtotal), "Descuento": r2(p.descuento),
        "Envío": r2(p.envio?.costo), "Total": r2(p.total), "Comisión": p.sellerId ? comision(p.total, cfg) : 0
      });
      (p.historial || []).forEach((h) => historial.push({
        "Tipo": "Pedido web", "Referencia": p.codigo || d.id, "Vendedor": nombre(p.sellerId),
        "Estado nuevo": ETQ[h.estado] || h.estado, "Fecha y hora": fmt(aFecha(h.fecha)), "Hecho por": h.por || ""
      }));
    });

    // Hoja 2 — Ventas en persona
    const hojaVentas = [];
    ventas.forEach((d) => {
      const v = d.data(), f = aFecha(v.fecha);
      if (!pasa(v.sellerId, f)) return;
      hojaVentas.push({
        "ID": d.id, "Fecha": fmt(f), "Vendedor": nombre(v.sellerId), "Estado": ETQ[v.estado] || v.estado,
        "Piezas": piezasTxt(v.piezas), "Subtotal": r2(v.subtotal),
        "Tipo de descuento": v.tipoDescuento === "codigo" ? "Código" : v.tipoDescuento === "monto" ? "Monto aprobado" : "Ninguno",
        "Descuento": r2(v.descuento), "Total": r2(v.precioFinal), "Método de pago": v.metodoPago || "",
        "Cliente": v.cliente || "", "Anticipo": v.anticipo ?? "", "Saldo": v.saldo ?? "", "Comisión": comision(v.precioFinal, cfg)
      });
      historial.push({ "Tipo": "Venta en persona", "Referencia": d.id, "Vendedor": nombre(v.sellerId),
        "Estado nuevo": "Pendiente (registrada)", "Fecha y hora": fmt(f), "Hecho por": vendedores[v.sellerId]?.correo || v.sellerId });
      (v.historial || []).forEach((h) => historial.push({
        "Tipo": "Venta en persona", "Referencia": d.id, "Vendedor": nombre(v.sellerId),
        "Estado nuevo": ETQ[h.estado] || h.estado, "Fecha y hora": fmt(aFecha(h.fecha)), "Hecho por": h.por || ""
      }));
    });
    historial.sort((a, b) => String(a["Fecha y hora"]).localeCompare(String(b["Fecha y hora"])));

    // Hoja 4 — Comisiones por mes (todos los meses con movimiento)
    const hist = (h) => (h || []).map((x) => ({ estado: x.estado, fecha: aFecha(x.fecha) }));
    const regs = {};
    ventas.forEach((d) => { const v = d.data(); (regs[v.sellerId] ||= []).push({ fecha: aFecha(v.fecha), monto: v.precioFinal, estado: v.estado, historial: hist(v.historial), ingreso: v.precioFinal, piezas: v.piezas || [] }); });
    pedidos.forEach((d) => { const p = d.data(); if (p.sellerId) (regs[p.sellerId] ||= []).push({ fecha: aFecha(p.creado), monto: p.total, estado: p.estado, historial: hist(p.historial), ingreso: (Number(p.subtotal) || 0) - (Number(p.descuento) || 0), piezas: p.items || [] }); });
    const guardados = {}; const pagadosPor = {};
    resumenes.forEach((d) => { const r = d.data(); guardados[d.id] = r; if (r.comisionPagada) (pagadosPor[r.sellerId] ||= new Set()).add(r.mes); });
    const pagosCom = {};
    pagos.forEach((d) => { const p = d.data(); if (p.tipo !== "bono") pagosCom[`${p.sellerId}_${p.mes}`] = r2((pagosCom[`${p.sellerId}_${p.mes}`] || 0) + (Number(p.monto) || 0)); });
    const hojaComisiones = [];
    Object.keys(vendedores).filter((id) => !vendedor || id === vendedor).forEach((id) => {
      const meses = new Set((regs[id] || []).filter((r) => r.fecha).map((r) => claveMes(r.fecha)));
      Object.values(guardados).filter((g) => g.sellerId === id).forEach((g) => meses.add(g.mes));
      [...meses].filter((m) => !soloMes || m === soloMes).sort().forEach((mes) => {
        const r = resumenMes(regs[id] || [], mes, cfg, pagadosPor[id] || new Set());
        const mg = margenMes(regs[id] || [], mes, costos, cfg);
        const g = guardados[`${id}_${mes}`] || {};
        const pagado = pagosCom[`${id}_${mes}`] || 0;
        hojaComisiones.push({
          "Vendedor": nombre(id), "Mes": mes, "Ventas pagadas ($)": r.total, "N.º ventas pagadas": r.pagadas,
          "Meta (%)": r.pct, "Comisión": r.comision, "Descuento por devoluciones": r.ajusteDevoluciones,
          "A pagar": r.aPagar, "Pagado": pagado, "Falta pagar": r2(Math.max(0, r.aPagar - pagado)),
          "Comisión pagada": g.comisionPagada || (r.aPagar > 0 && pagado >= r.aPagar) ? "Sí" : "No",
          "Bono": r.bono || "—", "Bono entregado": r.bono ? (g.bonoEntregado ? "Sí" : "No") : "—",
          "Margen estimado (solo admin)": mg.margen, "Piezas sin costo": mg.sinCosto,
          "Bono / margen (%)": mg.bonoPctMargen ?? ""
        });
      });
    });

    // Hoja 5 — Pagos registrados
    const hojaPagos = [];
    pagos.forEach((d) => {
      const p = d.data();
      if (vendedor && p.sellerId !== vendedor) return;
      if (soloMes && p.mes !== soloMes) return;
      hojaPagos.push({ "Vendedor": nombre(p.sellerId), "Mes que se paga": p.mes, "Tipo": p.tipo === "bono" ? "Bono" : "Comisión",
        "Monto": r2(p.monto), "Fecha de pago": p.fechaPago || "", "Comprobante": p.comprobante || "",
        "Registrado por": p.por || "", "Registrado el": fmt(aFecha(p.creado)) });
    });

    // Hoja 6 — Vendedores
    const hojaVendedores = Object.entries(vendedores).filter(([id]) => !vendedor || id === vendedor).map(([id, v]) => ({
      "Nombre": v.nombre, "Código": v.codigo, "Usuario": v.usuario, "Estado": v.activo ? "Activo" : "Inactivo",
      "Alta": fmt(aFecha(v.alta)), "Cuenta vinculada": v.uid ? "Sí" : "No"
    }));

    const libro = XLSX.utils.book_new();
    const agregar = (filas, titulo) => {
      const hoja = XLSX.utils.json_to_sheet(filas.length ? filas : [{ "Sin datos": "No hay registros para este filtro" }]);
      const cols = Object.keys(filas[0] || { "Sin datos": "" });
      hoja["!cols"] = cols.map((c) => ({ wch: Math.min(60, Math.max(c.length, ...filas.map((f) => String(f[c] ?? "").length)) + 2) }));
      XLSX.utils.book_append_sheet(libro, hoja, titulo);
    };
    agregar(hojaPedidos, "Pedidos web");
    agregar(hojaVentas, "Ventas en persona");
    agregar(historial, "Historial de estados");
    agregar(hojaComisiones, "Comisiones por mes");
    agregar(hojaPagos, "Pagos");
    agregar(hojaVendedores, "Vendedores");

    const quien = vendedor ? (vendedores[vendedor]?.codigo || vendedor) : "todos";
    const cuando = soloMes || "historial-completo";
    XLSX.writeFile(libro, `SilverCow_${quien}_${cuando}.xlsx`);
    est.textContent = `✓ Descargado: ${hojaPedidos.length} pedidos, ${hojaVentas.length} ventas, ${historial.length} cambios de estado, ${hojaPagos.length} pagos.`;
    est.className = "admin-alta-ok";
  } catch (e) {
    console.error("admin/exportar", e);
    est.textContent = "No se pudo generar el Excel: " + e.message;
    est.className = "admin-alta-error";
  } finally {
    btn.disabled = false;
  }
}
