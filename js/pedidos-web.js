// ══════════════════════════════════════════════════
// PEDIDOS WEB → FIRESTORE (feature 012, Fase 4, RF-01)
// Módulo ES con puente en `window` (mismo patrón que firestore-catalogo.js):
// el carrito de index.html es un script clásico y llama a
// window.guardarPedidoWeb() antes de abrir WhatsApp.
//
// Código de pedido: "SC-" + 6 caracteres sin ambiguos (sin 0/O, 1/I/L).
// No es consecutivo (decisión del dueño): se genera acá y, si por azar ya
// existe, Firestore rechaza la escritura (las reglas no dejan a un cliente
// sobrescribir un pedido) y se prueba con otro código.
// El pedido nace "sin_confirmar" con `expira` = +24 h: una política TTL de
// Firestore lo borra solo si nadie lo confirma (RF-03, RS-13). Al confirmarlo,
// el admin borra `expira`.
// ══════════════════════════════════════════════════
import { doc, setDoc, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
import { db } from "./admin/firebase-config.js";

const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const HORAS_VIGENCIA = 24;

function codigoPedido() {
  const r = new Uint32Array(6);
  crypto.getRandomValues(r);
  return "SC-" + Array.from(r, (n) => ALFABETO[n % ALFABETO.length]).join("");
}

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Guarda el pedido y devuelve su código. Lanza error si no se pudo.
 * datos: { items:[{codigo,nombre,cantidad,precio,esPedido}], subtotal,
 *          descuento, total, sellerId, envio:{tipo,costo} }
 */
window.guardarPedidoWeb = async function guardarPedidoWeb(datos) {
  const items = (datos.items || []).slice(0, 30).map((p) => ({
    codigo: String(p.codigo || "").replace(/[\[\]]/g, "").trim(),
    nombre: String(p.nombre || "").slice(0, 120),
    cantidad: Number(p.cantidad) || 1,
    precio: r2(p.precio),
    esPedido: !!p.esPedido
  }));
  let ultimoError;
  for (let intento = 0; intento < 3; intento++) {
    const codigo = codigoPedido();
    try {
      await setDoc(doc(db, "pedidos", codigo), {
        codigo,
        items,
        subtotal: r2(datos.subtotal),
        descuento: r2(datos.descuento),
        total: r2(datos.total),
        sellerId: datos.sellerId || null,
        envio: { tipo: String(datos.envio?.tipo || ""), costo: r2(datos.envio?.costo) },
        estado: "sin_confirmar",
        creado: serverTimestamp(),
        expira: Timestamp.fromMillis(Date.now() + HORAS_VIGENCIA * 3600 * 1000)
      });
      return codigo;
    } catch (e) {
      ultimoError = e; // permission-denied = código repetido o datos inválidos
    }
  }
  throw ultimoError;
};
