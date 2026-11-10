// ══════════════════════════════════════════════════
// COMISIONES — sección del panel admin (feature 012, Fase 6)
// RF-14 (calcular por vendedor y mes), RF-15 (registrar pago con fecha y
// comprobante), RF-16 / RNF-13 (reglas editables sin tocar código),
// RNF-07 (resumen guardado en `resumenes/{sellerId_AAAA-MM}`).
//
// - El cálculo es el de js/vendedor/negocio.js (resumenMes), el mismo que
//   ve el vendedor: una sola fuente de verdad.
// - `resumenes/` lo lee el vendedor (solo el suyo): por eso ahí NO va el
//   comprobante. Los pagos con comprobante van en `pagos/` (solo admin).
// - El pago se hace fuera del sistema (RS-10): esto solo lo registra.
// ══════════════════════════════════════════════════
import {
  collection, getDocs, getDoc, doc, setDoc, addDoc, writeBatch, query, where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
import { db, auth } from "./firebase-config.js";
import { armarConfig, conValoresBono, resumenMes, margenMes, claveMes, comision } from "../vendedor/negocio.js";

const $ = (id) => document.getElementById(id);
const usd = (n) => "$" + (Number(n) || 0).toFixed(2);
function escapar(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
const aFecha = (ts) => (ts && typeof ts.toDate === "function" ? ts.toDate() : null);

let cfg = armarConfig();
let cargado = false;

$("mesComisiones").value = claveMes();
document.addEventListener("admin:seccion", (ev) => { if (ev.detail?.seccion === "comisiones" && !cargado) calcular(); });
$("btnCalcularCom").addEventListener("click", calcular);
$("mesComisiones").addEventListener("change", calcular);

// Reglas del negocio (config/negocio) + lo que cuesta cada bono (config/privado, solo admin).
async function leerConfig() {
  const [c, priv] = await Promise.all([getDoc(doc(db, "config", "negocio")), getDoc(doc(db, "config", "privado"))]);
  cfg = conValoresBono(armarConfig(c.exists() ? c.data() : null), priv.exists() ? priv.data() : null);
}

// ── Resumen del mes ──
async function calcular() {
  cargado = true;
  const mes = $("mesComisiones").value || claveMes();
  const est = $("estadoComisiones");
  const lista = $("listaComisiones");
  lista.innerHTML = "";
  est.hidden = false;
  est.textContent = "Calculando...";
  try {
    await leerConfig();
    // No pisar lo que el admin está editando si solo cambió de mes.
    if ($("cfgSinGuardar").hidden) pintarReglas();
    const [vend, ventas, pedidos, resumenes, pagos, costosSnap] = await Promise.all([
      getDocs(collection(db, "vendedores")),
      getDocs(collection(db, "ventas")),
      getDocs(collection(db, "pedidos")),
      getDocs(collection(db, "resumenes")),
      getDocs(query(collection(db, "pagos"), where("mes", "==", mes))),
      getDocs(collection(db, "costos"))
    ]);
    const costos = {};
    costosSnap.forEach((d) => (costos[d.id] = d.data().costo));
    const hist = (h) => (h || []).map((x) => ({ estado: x.estado, fecha: aFecha(x.fecha) }));
    const regs = {};
    ventas.forEach((d) => {
      const v = d.data();
      (regs[v.sellerId] ||= []).push({ tipo: "venta", fecha: aFecha(v.fecha), monto: v.precioFinal, estado: v.estado, historial: hist(v.historial),
        ingreso: v.precioFinal, piezas: v.piezas || [] });
    });
    pedidos.forEach((d) => {
      const p = d.data();
      if (!p.sellerId) return;
      (regs[p.sellerId] ||= []).push({ tipo: "pedido", fecha: aFecha(p.creado), monto: p.total, estado: p.estado, historial: hist(p.historial),
        ingreso: (Number(p.subtotal) || 0) - (Number(p.descuento) || 0), piezas: p.items || [] });
    });
    const guardados = {};
    const pagadosPorVend = {};
    resumenes.forEach((d) => {
      const r = d.data();
      guardados[d.id] = r;
      if (r.comisionPagada) (pagadosPorVend[r.sellerId] ||= new Set()).add(r.mes);
    });
    const pagosPorVend = {};
    pagos.forEach((d) => (pagosPorVend[d.data().sellerId] ||= []).push(d.data()));

    if (vend.empty) { est.textContent = "No hay vendedores."; return; }
    est.hidden = true;
    vend.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), "es"))
      .forEach((v) => {
        const r = resumenMes(regs[v.id] || [], mes, cfg, pagadosPorVend[v.id] || new Set());
        const m = margenMes(regs[v.id] || [], mes, costos, cfg);
        lista.appendChild(tarjeta(v, r, guardados[`${v.id}_${mes}`] || {}, pagosPorVend[v.id] || [], m));
      });
  } catch (e) {
    console.error("admin/comisiones", e);
    est.textContent = "Error al calcular: " + e.message;
  }
}

// Guarda el resumen del mes (lo puede leer el vendedor: sin comprobantes ni margen).
async function guardarResumen(v, r, extra) {
  await setDoc(doc(db, "resumenes", `${v.id}_${r.mes}`), {
    sellerId: v.id, mes: r.mes, total: r.total, pagadas: r.pagadas, comision: r.comision,
    ajusteDevoluciones: r.ajusteDevoluciones, aPagar: r.aPagar, saldoEnContra: r.saldoEnContra,
    pct: r.pct, meta: r.meta, bono: r.bono, actualizado: serverTimestamp(), ...extra
  }, { merge: true });
}

// Tarjeta de comisión de un vendedor: números del mes, lo ya pagado, bono, margen
// (solo admin) y el formulario "Registrar pago".
function tarjeta(v, r, guardado, pagos, m) {
  // Lo ya pagado de comisión este mes (pagos registrados) se resta de "A pagar".
  const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
  const pagadoCom = r2(pagos.filter((p) => p.tipo !== "bono").reduce((s, p) => s + (Number(p.monto) || 0), 0));
  const falta = r2(Math.max(0, r.aPagar - pagadoCom));
  const saldada = r.aPagar > 0 && falta <= 0;
  const el = document.createElement("div");
  el.className = "admin-fila admin-fila-comision" + (v.activo ? "" : " archivada");
  const hoy = new Date().toISOString().slice(0, 10);
  el.innerHTML = `
    <div class="admin-fila-campos">
      <div class="admin-fila-codigo">${escapar(v.codigo)} · ${escapar(r.mes)}</div>
      <div class="admin-vend-nombre">${escapar(v.nombre)}</div>
      <div class="admin-com-grid">
        <div><span>Ventas pagadas</span><strong>${usd(r.total)}</strong><small>${r.pagadas} venta${r.pagadas === 1 ? "" : "s"}${r.pendientes ? ` · ${r.pendientes} sin pagar` : ""}</small></div>
        <div><span>Meta</span><strong>${r.pct}%</strong><small>de ${usd(r.meta)}</small></div>
        <div><span>Comisión</span><strong>${usd(r.comision)}</strong>${r.ajusteDevoluciones ? `<small>− ${usd(r.ajusteDevoluciones)} por devoluciones</small>` : ""}</div>
        <div class="${saldada ? "admin-com-saldada" : ""}"><span>A pagar</span><strong>${usd(falta)}</strong>
          ${pagadoCom ? `<small>Comisión ${usd(r.aPagar)} · ya pagado ${usd(pagadoCom)}</small>` : ""}
          ${saldada ? "<small>Pagada completa ✓</small>" : ""}
          ${r.saldoEnContra ? `<small>Saldo en contra ${usd(r.saldoEnContra)} (se descuenta el mes siguiente)</small>` : ""}</div>
      </div>
      <div class="admin-vend-dato">Bono: <strong>${r.bono ? escapar(r.bono) : "no alcanzado"}</strong>${r.avance.proximo ? ` · faltan ${usd(r.avance.faltaParaProximo)} para el siguiente` : ""}</div>
      <div class="admin-vend-dato admin-com-margen" title="Solo lo ves tú. Informativo: no limita ni bloquea el bono (RF-20).">
        Margen estimado (solo tú): <strong>${usd(m.margen)}</strong>
        ${m.incluidos ? ` (ventas ${usd(m.ingreso)} − costo ${usd(m.costo)})` : ""}
        ${m.bonoPctMargen != null ? ` · el bono ($${m.valorBono}) es el <strong>${m.bonoPctMargen}%</strong> del margen` : ""}
        ${m.sinCosto ? ` · <span class="admin-vend-pendiente">${m.sinCosto} pieza${m.sinCosto === 1 ? "" : "s"} sin costo cargado (no entran)</span>` : ""}
      </div>
      <div class="admin-com-checks">
        <label class="admin-check"><input type="checkbox" class="com-pagada" ${guardado.comisionPagada || saldada ? "checked" : ""}> Comisión pagada</label>
        <label class="admin-check"><input type="checkbox" class="com-bono" ${guardado.bonoEntregado ? "checked" : ""} ${r.bono ? "" : "disabled"}> Bono entregado</label>
      </div>
      <details class="admin-com-pago">
        <summary>Registrar pago</summary>
        <div class="admin-fila-linea2">
          <div class="admin-campo"><label class="admin-label">Tipo</label>
            <select class="admin-select com-tipo"><option value="comision">Comisión</option><option value="bono">Bono</option></select></div>
          <div class="admin-campo"><label class="admin-label">Monto ($)</label>
            <input class="admin-input com-monto" type="number" min="0" step="0.01" value="${falta.toFixed(2)}"></div>
          <div class="admin-campo"><label class="admin-label">Fecha</label>
            <input class="admin-input com-fecha" type="date" value="${hoy}"></div>
        </div>
        <label class="admin-label">Comprobante (número de transferencia, nota, etc.)</label>
        <input class="admin-input com-comprobante" type="text" maxlength="120">
        <button type="button" class="admin-btn-mini com-registrar" style="margin-top:8px;">Registrar pago</button>
      </details>
      ${pagos.length ? `<ul class="admin-pedido-items">${pagos.map((p) => `<li>${escapar(p.tipo === "bono" ? "Bono" : "Comisión")} ${usd(p.monto)} · ${escapar(p.fechaPago || "")} · ${escapar(p.comprobante || "sin comprobante")}</li>`).join("")}</ul>` : ""}
    </div>
    <div class="admin-fila-acciones">
      <button type="button" class="admin-btn-mini com-guardar">Guardar resumen</button>
      <span class="admin-fila-ok" hidden>✓</span>
    </div>`;

  const ok = el.querySelector(".admin-fila-ok");
  const flash = () => { ok.hidden = false; setTimeout(() => (ok.hidden = true), 1500); };
  const accion = async (fn) => {
    try { await fn(); flash(); } catch (e) { console.error("admin/comisiones", e); alert("No se pudo guardar: " + e.message); }
  };

  el.querySelector(".com-guardar").onclick = () => accion(() => guardarResumen(v, r, { pagado: pagadoCom, falta, ...(saldada ? { comisionPagada: true } : {}) }));
  el.querySelector(".com-pagada").onchange = (ev) => accion(() => guardarResumen(v, r, { comisionPagada: ev.target.checked }));
  el.querySelector(".com-bono").onchange = (ev) => accion(() => guardarResumen(v, r, { bonoEntregado: ev.target.checked }));
  el.querySelector(".com-registrar").onclick = () => accion(async () => {
    const tipo = el.querySelector(".com-tipo").value;
    const monto = Math.round((Number(el.querySelector(".com-monto").value) || 0) * 100) / 100;
    const fechaPago = el.querySelector(".com-fecha").value;
    if (!fechaPago) throw new Error("Pon la fecha del pago.");
    if (tipo === "comision" && monto <= 0) throw new Error("El monto tiene que ser mayor a 0.");
    await addDoc(collection(db, "pagos"), {
      sellerId: v.id, mes: r.mes, tipo, monto, fechaPago,
      comprobante: el.querySelector(".com-comprobante").value.trim() || null,
      por: auth.currentUser?.email || "admin", creado: serverTimestamp()
    });
    if (tipo === "bono") {
      await guardarResumen(v, r, { bonoEntregado: true });
    } else {
      // Marca "pagada" solo si con este pago se cubre todo lo del mes (pagos parciales: no).
      const nuevoPagado = r2(pagadoCom + monto);
      const nuevaFalta = r2(Math.max(0, r.aPagar - nuevoPagado));
      await guardarResumen(v, r, { pagado: nuevoPagado, falta: nuevaFalta, comisionPagada: nuevaFalta <= 0, pagoFecha: fechaPago });
    }
    calcular();
  });
  return el;
}

// ── Editor de reglas (RF-16) ──
// Pensado para leerse como frases ("Ventas de $10 a $15 → $2 fijos"), con
// un simulador en vivo que usa la MISMA función comision() que el resto del
// sistema, así lo que se ve acá es exactamente lo que se va a pagar.
// Modelo: tramos = [{ hasta, fijo } | { hasta, pct }], el último sin "hasta".
let borrador = null;

const copia = (x) => JSON.parse(JSON.stringify(x));
const tipoDe = (t) => (t.fijo != null ? "fijo" : "pct");
const valorDe = (t) => (t.fijo != null ? t.fijo : t.pct ?? 0);

// Lo que está escrito ahora en el editor, como un objeto de reglas listo para usar.
function borradorComoCfg() {
  return armarConfig({
    ...borrador,
    pctCodigo: Number($("cfgPct").value),
    sinComisionMenorA: Number($("cfgMinimo").value),
    meta: Number($("cfgMeta").value)
  });
}

// Copia las reglas guardadas al editor (borrador) y lo dibuja.
function pintarReglas() {
  borrador = copia({ pctCodigo: cfg.pctCodigo, sinComisionMenorA: cfg.sinComisionMenorA, meta: cfg.meta, tramos: cfg.tramos, bonos: cfg.bonos });
  $("cfgPct").value = borrador.pctCodigo;
  $("cfgMinimo").value = borrador.sinComisionMenorA;
  $("cfgMeta").value = borrador.meta;
  pintarTramos();
  pintarBonos();
  refrescar();
}

// "Desde" de cada tramo = el "hasta" del anterior (o el mínimo sin comisión).
function desdeDe(i) {
  return i === 0 ? Number($("cfgMinimo").value) || 0 : Number(borrador.tramos[i - 1].hasta) || 0;
}

// Dibuja los tramos como frases editables ("De $10 a $15 → $2 fijos").
function pintarTramos() {
  const ult = borrador.tramos.length - 1;
  $("cfgTramos").innerHTML = borrador.tramos.map((t, i) => `
    <div class="reg-tramo">
      <span class="reg-rango">${i === ult
        ? `Más de $<span data-desde="${i}">${desdeDe(i)}</span>`
        : `De $<span data-desde="${i}">${desdeDe(i)}</span> a $<input class="admin-input reg-in" type="number" step="0.5" min="0" data-t="${i}" data-k="hasta" value="${t.hasta ?? ""}" aria-label="Hasta cuántos dólares">`}</span>
      <span class="reg-flecha" aria-hidden="true">→</span>
      <select class="admin-select reg-tipo" data-t="${i}" data-k="tipo" aria-label="Tipo de comisión">
        <option value="fijo" ${tipoDe(t) === "fijo" ? "selected" : ""}>$ fijos</option>
        <option value="pct" ${tipoDe(t) === "pct" ? "selected" : ""}>% de la venta</option>
      </select>
      <span class="reg-valor">${tipoDe(t) === "fijo" ? "$" : ""}<input class="admin-input reg-in" type="number" step="0.5" min="0" data-t="${i}" data-k="valor" value="${valorDe(t)}" aria-label="Valor de la comisión">${tipoDe(t) === "pct" ? " %" : ""}</span>
      ${borrador.tramos.length > 1 ? `<button type="button" class="admin-btn-mini" data-quitar-tramo="${i}" aria-label="Quitar este tramo">Quitar</button>` : ""}
    </div>`).join("");

  $("cfgTramos").querySelectorAll("[data-k]").forEach((el) => {
    const t = borrador.tramos[el.dataset.t];
    if (el.dataset.k === "tipo") {
      el.onchange = () => { const v = valorDe(t); delete t.fijo; delete t.pct; t[el.value] = v; pintarTramos(); refrescar(); };
    } else {
      el.oninput = () => {
        if (el.dataset.k === "hasta") t.hasta = el.value === "" ? null : Number(el.value);
        else { const k = tipoDe(t); t[k] = Number(el.value); }
        actualizarDesdes();
        refrescar();
      };
    }
  });
  $("cfgTramos").querySelectorAll("[data-quitar-tramo]").forEach((b) => (b.onclick = () => {
    borrador.tramos.splice(Number(b.dataset.quitarTramo), 1);
    borrador.tramos[borrador.tramos.length - 1].hasta = null; // el último siempre queda "más de…"
    pintarTramos(); refrescar();
  }));
}

// Al cambiar un "hasta", actualiza el "desde" del tramo siguiente sin redibujar todo.
function actualizarDesdes() {
  $("cfgTramos").querySelectorAll("[data-desde]").forEach((s) => (s.textContent = desdeDe(Number(s.dataset.desde))));
}

// Dibuja los bonos como frases editables ("Al llegar a $50 gana: …").
function pintarBonos() {
  $("cfgBonos").innerHTML = borrador.bonos.map((b, i) => `
    <div class="reg-bono">
      <p class="reg-frase">Al llegar a $<input class="admin-input reg-in" type="number" step="5" min="0" data-b="${i}" data-k="desde" value="${b.desde}" aria-label="Monto para ganar el bono">
        en ventas del mes, gana:</p>
      <input class="admin-input reg-texto" type="text" maxlength="120" data-b="${i}" data-k="texto" value="${escapar(b.texto)}" placeholder="Ej. Pieza de edición limitada de hasta $10" aria-label="Qué gana">
      <p class="reg-frase reg-gris">Le cuesta a la casa: $<input class="admin-input reg-in" type="number" step="0.5" min="0" data-b="${i}" data-k="valor" value="${b.valor ?? 0}" aria-label="Costo del bono para la casa">
        <button type="button" class="admin-btn-mini" data-quitar-bono="${i}" aria-label="Quitar este bono">Quitar</button></p>
    </div>`).join("") || '<p class="admin-ayuda">Sin bonos.</p>';
  $("cfgBonos").querySelectorAll("[data-k]").forEach((el) => (el.oninput = () => {
    const b = borrador.bonos[el.dataset.b];
    b[el.dataset.k] = el.dataset.k === "texto" ? el.value : Number(el.value);
    refrescar();
  }));
  $("cfgBonos").querySelectorAll("[data-quitar-bono]").forEach((b) =>
    (b.onclick = () => { borrador.bonos.splice(Number(b.dataset.quitarBono), 1); pintarBonos(); refrescar(); }));
}

$("cfgAgregarTramo").onclick = () => {
  const n = borrador.tramos.length;
  const antes = n > 1 ? Number(borrador.tramos[n - 2].hasta) || 0 : Number($("cfgMinimo").value) || 0;
  borrador.tramos.splice(n - 1, 0, { hasta: antes + 10, pct: valorDe(borrador.tramos[n - 1]) });
  pintarTramos(); refrescar();
};
$("cfgAgregarBono").onclick = () => {
  const ult = borrador.bonos[borrador.bonos.length - 1];
  borrador.bonos.push({ desde: (ult ? ult.desde : 0) + 50, texto: "", valor: 0 });
  pintarBonos(); refrescar();
};
["cfgPct", "cfgMinimo", "cfgMeta"].forEach((id) => $(id).addEventListener("input", () => { actualizarDesdes(); refrescar(); }));
$("simMonto").addEventListener("input", refrescar);
$("cfgDescartar").onclick = () => { pintarReglas(); $("cfgEstado").hidden = true; };

// Simulador + aviso de cambios sin guardar + errores en vivo.
function refrescar() {
  if (!borrador) return;
  const c = borradorComoCfg();
  const err = validar(c);
  const sim = Number($("simMonto").value) || 0;
  $("simResultado").textContent = err ? "— (revisa los datos)" : `${usd(comision(sim, c))} de comisión`;
  const montos = [5, c.sinComisionMenorA, 15, 25, 40, 60, 90, 120]
    .filter((m, i, a) => m >= 0 && a.indexOf(m) === i).sort((a, b) => a - b);
  $("simTabla").innerHTML = err ? "" : montos.map((m) => `<tr><td>${usd(m)}</td><td>${usd(comision(m, c))}</td></tr>`).join("");
  $("simMeta").textContent = err ? "" : `Con la meta de ${usd(c.meta)}: ` + (c.bonos.length
    ? [...c.bonos].sort((a, b) => a.desde - b.desde).map((b) => `al llegar a ${usd(b.desde)} gana "${b.texto || "…"}"`).join("; ") + "."
    : "sin bonos.");
  const actual = JSON.stringify({ p: cfg.pctCodigo, m: cfg.sinComisionMenorA, t: cfg.tramos, me: cfg.meta, b: cfg.bonos });
  const nuevo = JSON.stringify({ p: c.pctCodigo, m: c.sinComisionMenorA, t: c.tramos, me: c.meta, b: c.bonos });
  $("cfgSinGuardar").hidden = actual === nuevo;
  const est = $("cfgEstado");
  if (err) { est.hidden = false; est.textContent = "⚠ " + err; est.className = "admin-alta-error"; }
  else if (est.className === "admin-alta-error") est.hidden = true;
}

// Revisa que las reglas tengan sentido antes de dejar guardarlas.
function validar(c) {
  if (!(c.pctCodigo >= 0 && c.pctCodigo <= 50)) return "El descuento del código tiene que estar entre 0 y 50 %.";
  if (!(c.sinComisionMenorA >= 0)) return "El monto mínimo no puede ser negativo.";
  if (!(c.meta > 0)) return "La meta tiene que ser mayor a $0.";
  if (!c.tramos.length) return "Hace falta al menos un tramo.";
  const conLimite = c.tramos.slice(0, -1);
  if (conLimite.some((t) => t.hasta == null || isNaN(t.hasta))) return "Cada tramo (menos el último) necesita su monto \"a $…\".";
  let prev = c.sinComisionMenorA;
  for (const t of conLimite) {
    if (!(t.hasta > prev)) return `Los tramos tienen que ir de menor a mayor: $${t.hasta} no es mayor que $${prev}.`;
    prev = t.hasta;
  }
  if (c.tramos.some((t) => !(valorDe(t) >= 0))) return "La comisión de un tramo no puede ser negativa.";
  if (c.tramos.some((t) => tipoDe(t) === "pct" && valorDe(t) > 100)) return "Un porcentaje no puede pasar de 100 %.";
  if (c.bonos.some((b) => !(b.desde > 0))) return "Cada bono necesita el monto al que se gana (mayor a $0).";
  if (c.bonos.some((b) => !String(b.texto).trim())) return "Escribe qué gana el vendedor en cada bono.";
  if (c.bonos.some((b) => !(Number(b.valor) >= 0))) return "Lo que le cuesta el bono a la casa tiene que ser $0 o más.";
  return null;
}

$("cfgGuardar").onclick = async () => {
  const estado = $("cfgEstado");
  const nuevo = borradorComoCfg();
  nuevo.bonos = [...nuevo.bonos].sort((a, b) => a.desde - b.desde);
  const err = validar(nuevo);
  if (err) { estado.hidden = false; estado.textContent = "⚠ " + err; estado.className = "admin-alta-error"; return; }
  const cambiaPct = nuevo.pctCodigo !== cfg.pctCodigo;
  if (!confirm(`¿Guardar las reglas nuevas?${cambiaPct ? `\n\nEl descuento de TODOS los códigos de vendedor pasa a ${nuevo.pctCodigo} %.` : ""}\n\nSe aplican a todo lo que se calcule desde ahora, también a los meses anteriores que vuelvas a abrir.`)) return;
  $("cfgGuardar").disabled = true;
  try {
    const b = writeBatch(db);
    // Lo que ve el vendedor (sin el costo de los bonos)…
    b.set(doc(db, "config", "negocio"), {
      pctCodigo: nuevo.pctCodigo, sinComisionMenorA: nuevo.sinComisionMenorA, tramos: nuevo.tramos,
      meta: nuevo.meta, bonos: nuevo.bonos.map(({ desde, texto }) => ({ desde, texto })),
      actualizado: serverTimestamp(), por: auth.currentUser?.email || "admin"
    });
    // …y el costo de cada bono, aparte, solo para el admin (RNF-16).
    b.set(doc(db, "config", "privado"), {
      valoresBono: Object.fromEntries(nuevo.bonos.map((x) => [String(x.desde), Number(x.valor) || 0])),
      actualizado: serverTimestamp()
    });
    if (cambiaPct) {
      const cods = await getDocs(collection(db, "codigos"));
      cods.forEach((d) => b.update(d.ref, { pct: nuevo.pctCodigo }));
    }
    await b.commit();
    estado.hidden = false;
    estado.textContent = "✓ Reglas guardadas.";
    estado.className = "admin-alta-ok";
    calcular();
  } catch (e) {
    console.error("admin/comisiones: reglas", e);
    estado.hidden = false;
    estado.textContent = "No se pudo guardar: " + e.message;
    estado.className = "admin-alta-error";
  } finally {
    $("cfgGuardar").disabled = false;
  }
};

// Arranca con los valores por defecto; se reemplazan al leer config/negocio.
pintarReglas();
