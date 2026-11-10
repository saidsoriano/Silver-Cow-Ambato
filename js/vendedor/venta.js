// ══════════════════════════════════════════════════
// VENTA EN PERSONA — formulario del panel del vendedor
// Feature 012, Fase 5 (RF-07, RF-08, RS-03, RS-16).
//
// - Las piezas se buscan por código; el precio sale SOLO del catálogo (el
//   vendedor no lo puede escribir).
// - Un solo tipo de descuento: el % del código o un monto en dólares que el
//   admin aprobó antes. Al usar uno, el otro se bloquea.
// - Se guarda en `ventas/` como "pendiente". El admin la confirma en su
//   panel; recién ahí las piezas en stock pasan a "agotado" (spec, punto 8).
//   Las reglas de Firestore validan los campos y que el precio final no
//   supere el subtotal.
// ══════════════════════════════════════════════════
import {
  collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
import { db } from "../admin/firebase-config.js";
import { comision } from "./negocio.js";

const $ = (id) => document.getElementById(id);
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const usd = (n) => "$" + (Number(n) || 0).toFixed(2);
function escapar(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

// Conecta el formulario "Registrar venta en persona". Lo llama panel.js cuando
// ya tiene el catálogo (precios y estados) y las reglas del negocio.
export function iniciarVenta({ sellerId, cfg, piezas, alGuardar }) {
  const porCodigo = new Map(piezas.map((p) => [p.codigo.toUpperCase(), p]));
  let lineas = []; // { codigo, nombre, precio, cantidad, estadoPieza }

  const form = $("formVenta");
  const inCod = $("ventaCodigo");
  const inCant = $("ventaCantidad");
  const errPieza = $("ventaErrorPieza");
  const chkCodigo = $("ventaDescCodigo");
  const inMonto = $("ventaDescMonto");
  const estado = $("ventaEstado");

  $("ventaDescCodigoTxt").textContent = `${cfg.pctCodigo}% de mi código`;
  $("listaCodigos").innerHTML = piezas
    .filter((p) => p.estado !== "agotado")
    .map((p) => `<option value="${escapar(p.codigo)}">${escapar(p.nombre)} — ${usd(p.precio)}</option>`)
    .join("");

  $("btnAbrirVenta").onclick = () => { form.hidden = false; $("btnAbrirVenta").hidden = true; inCod.focus(); };
  $("btnCancelarVenta").onclick = () => {
    if (lineas.length && !confirm("Vas a perder esta venta sin registrar. ¿Cancelar?")) return;
    reiniciar();
  };

  // Deja el formulario vacío y cerrado.
  function reiniciar() {
    lineas = [];
    form.reset();
    chkCodigo.disabled = false;
    inMonto.disabled = false;
    errPieza.hidden = true;
    estado.hidden = true;
    form.hidden = true;
    $("btnAbrirVenta").hidden = false;
    pintar();
  }

  function mostrarError(el, msg) { el.textContent = msg; el.hidden = false; el.className = "vend-error-inline"; }

  // Agrega la pieza escrita: busca el código en el catálogo y toma SU precio.
  // Si ya estaba en la venta, suma la cantidad (máx. 20).
  function agregar() {
    errPieza.hidden = true;
    const cod = inCod.value.trim().toUpperCase();
    const cant = Math.floor(Number(inCant.value) || 0);
    const p = porCodigo.get(cod);
    if (!p) return mostrarError(errPieza, `No hay ninguna pieza con el código ${cod || "(vacío)"}.`);
    if (cant < 1 || cant > 20) return mostrarError(errPieza, "La cantidad tiene que ser entre 1 y 20.");
    if (p.estado === "agotado" && !confirm(`${p.codigo} figura AGOTADA en el catálogo. ¿Agregarla igual?`)) return;
    const ya = lineas.find((l) => l.codigo === p.codigo);
    if (ya) ya.cantidad = Math.min(20, ya.cantidad + cant);
    else lineas.push({ codigo: p.codigo, nombre: p.nombre, precio: r2(p.precio), cantidad: cant, estadoPieza: p.estado });
    inCod.value = "";
    inCant.value = "1";
    inCod.focus();
    pintar();
  }
  $("btnAgregarPieza").onclick = agregar;
  inCod.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); agregar(); } });

  // RF-08: un solo tipo de descuento.
  chkCodigo.addEventListener("change", () => {
    inMonto.disabled = chkCodigo.checked;
    if (chkCodigo.checked) inMonto.value = "";
    pintar();
  });
  inMonto.addEventListener("input", () => {
    const hay = Number(inMonto.value) > 0;
    chkCodigo.disabled = hay;
    if (hay) chkCodigo.checked = false;
    pintar();
  });

  // Subtotal, descuento (uno solo: % del código o monto aprobado), total y comisión estimada.
  function calcular() {
    const subtotal = r2(lineas.reduce((s, l) => s + l.precio * l.cantidad, 0));
    let tipo = "ninguno", descuento = 0;
    if (chkCodigo.checked) { tipo = "codigo"; descuento = r2((subtotal * cfg.pctCodigo) / 100); }
    else if (Number(inMonto.value) > 0) { tipo = "monto"; descuento = r2(Math.min(Number(inMonto.value), subtotal)); }
    const precioFinal = r2(subtotal - descuento);
    return { subtotal, tipo, descuento, precioFinal, comision: comision(precioFinal, cfg) };
  }

  // Redibuja la tabla de piezas, muestra anticipo/saldo si hay piezas bajo pedido y el resumen.
  function pintar() {
    const cuerpo = $("ventaLineas");
    cuerpo.innerHTML = lineas.length
      ? lineas.map((l, i) => `<tr>
          <td><code>${escapar(l.codigo)}</code> ${escapar(l.nombre)}${l.estadoPieza === "pedido" ? ' <span class="vend-pend">bajo pedido</span>' : ""}</td>
          <td>${l.cantidad}</td><td>${usd(l.precio)}</td><td>${usd(l.precio * l.cantidad)}</td>
          <td><button type="button" class="admin-btn-mini" data-quitar="${i}" aria-label="Quitar ${escapar(l.codigo)}">Quitar</button></td>
        </tr>`).join("")
      : '<tr><td colspan="5" class="vend-vacio">Agrega al menos una pieza.</td></tr>';
    cuerpo.querySelectorAll("[data-quitar]").forEach((b) =>
      (b.onclick = () => { lineas.splice(Number(b.dataset.quitar), 1); pintar(); }));
    $("ventaAnticipo").hidden = !lineas.some((l) => l.estadoPieza === "pedido");
    const c = calcular();
    $("ventaResumen").innerHTML = lineas.length ? `
      <div>Subtotal <strong>${usd(c.subtotal)}</strong></div>
      ${c.descuento ? `<div>Descuento (${c.tipo === "codigo" ? cfg.pctCodigo + "% código" : "monto aprobado"}) <strong>−${usd(c.descuento)}</strong></div>` : ""}
      <div class="vend-resumen-total">Total que paga el cliente <strong>${usd(c.precioFinal)}</strong></div>
      <div class="admin-ayuda">Tu comisión estimada: ${usd(c.comision)} (se gana cuando la venta queda pagada)</div>` : "";
  }

  // Guarda la venta como "pendiente". Las reglas de Firestore revisan los campos;
  // el admin la confirma después.
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    estado.hidden = true;
    if (!lineas.length) return mostrarError(estado, "Agrega al menos una pieza.");
    if (!$("ventaPago").value) return mostrarError(estado, "Elige el método de pago.");
    const c = calcular();
    const num = (id) => { const v = $(id).value.trim(); return v === "" ? null : r2(v); };
    const desc = lineas.map((l) => `${l.nombre} ×${l.cantidad}`);
    const btn = $("btnGuardarVenta");
    btn.disabled = true;
    try {
      await addDoc(collection(db, "ventas"), {
        sellerId,
        fecha: serverTimestamp(),
        piezas: lineas.map((l) => ({ codigo: l.codigo, nombre: l.nombre, cantidad: l.cantidad, precio: l.precio, estadoPieza: l.estadoPieza })),
        subtotal: c.subtotal,
        tipoDescuento: c.tipo,
        descuento: c.descuento,
        precioFinal: c.precioFinal,
        metodoPago: $("ventaPago").value,
        cliente: $("ventaCliente").value.trim() || null,
        anticipo: $("ventaAnticipo").hidden ? null : num("ventaAnticipoMonto"),
        saldo: $("ventaAnticipo").hidden ? null : num("ventaSaldo"),
        estado: "pendiente",
        descripcion: desc.slice(0, 2).join(", ") + (desc.length > 2 ? ` (+${desc.length - 2} más)` : "")
      });
      reiniciar();
      estado.textContent = "✓ Venta registrada. Queda pendiente hasta que el administrador confirme el pago.";
      estado.className = "vend-ok-inline";
      estado.hidden = false;
      if (alGuardar) alGuardar();
    } catch (e) {
      console.error("vendedor/venta", e);
      mostrarError(estado, "No se pudo registrar la venta: " + (e.code === "permission-denied" ? "revisa que tu cuenta esté activa." : e.message));
    } finally {
      btn.disabled = false;
    }
  });

  pintar();
}
