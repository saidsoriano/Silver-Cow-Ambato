// ══════════════════════════════════════════════════
// REGLAS DE NEGOCIO — comisiones, meta y bono (feature 012)
// Módulo puro (sin Firebase): lo usan el panel del vendedor y el del admin,
// y se prueba en Node con scripts/test-comisiones.mjs.
//
// Valores por defecto = decisiones del 2026-11-09 (spec.md). Cuando exista
// `config/negocio` en Firestore (Fase 6), esos valores pisan a estos sin
// tocar código (RNF-13).
// ══════════════════════════════════════════════════

export const NEGOCIO_POR_DEFECTO = {
  pctCodigo: 5,              // RS-01: descuento del código de vendedor, cualquier monto
  sinComisionMenorA: 10,     // menos de $10: sin comisión (pero suma a la meta, RS-06)
  // Tramos sobre el PRECIO FINAL (después del descuento, RS-04).
  // `hasta` incluido: el límite pertenece al tramo de abajo ($15 → $2 fijos).
  tramos: [
    { hasta: 15, fijo: 2 },
    { hasta: 40, pct: 10 },
    { hasta: 90, pct: 8 },
    { hasta: null, pct: 6 }   // más de $90
  ],
  meta: 50,                  // RS-09: meta mensual en ventas pagadas
  // `valor`: lo que le cuesta el bono a la casa, en $, solo para comparar
  // contra el margen (RF-20, informativo). Lo ve solo el admin.
  bonos: [
    { desde: 50,  texto: "Pieza de edición limitada de hasta $10 de precio de lista", valor: 10 },
    { desde: 100, texto: "$10 en efectivo o una pieza de hasta $15 de precio de lista", valor: 15 }
  ]
};

// Junta lo que venga de Firestore con los valores por defecto.
export function armarConfig(desdeFirestore) {
  return { ...NEGOCIO_POR_DEFECTO, ...(desdeFirestore || {}) };
}

// Solo admin: lo que le cuesta cada bono a la casa vive en `config/privado`
// ({ valoresBono: { "<desde>": valor } }), que el vendedor no puede leer
// (RNF-16). Se le pega a cada bono para calcular el margen.
export function conValoresBono(cfg, privado) {
  const v = (privado && privado.valoresBono) || null;
  if (!v) return cfg;
  return { ...cfg, bonos: cfg.bonos.map((b) => ({ ...b, valor: v[String(b.desde)] ?? b.valor ?? 0 })) };
}

const redondear = (n) => Math.round(n * 100) / 100;

// Comisión de UNA venta según su precio final (lo que pagó el cliente).
export function comision(precioFinal, cfg = NEGOCIO_POR_DEFECTO) {
  const p = Number(precioFinal) || 0;
  if (p < cfg.sinComisionMenorA) return 0;
  const t = cfg.tramos.find((x) => x.hasta === null || p <= x.hasta);
  if (!t) return 0;
  return redondear(t.fijo != null ? t.fijo : (p * t.pct) / 100);
}

// Avance de la meta del mes: total vendido (pagado), % y bono alcanzado/próximo.
export function avanceMeta(totalMes, cfg = NEGOCIO_POR_DEFECTO) {
  const total = redondear(Number(totalMes) || 0);
  const pct = cfg.meta > 0 ? Math.min(100, Math.round((total / cfg.meta) * 100)) : 0;
  const bonos = [...cfg.bonos].sort((a, b) => a.desde - b.desde);
  const alcanzado = bonos.filter((b) => total >= b.desde).pop() || null;
  const proximo = bonos.find((b) => total < b.desde) || null;
  return {
    total, meta: cfg.meta, pct, alcanzado, proximo,
    faltaParaProximo: proximo ? redondear(proximo.desde - total) : 0
  };
}

// "2026-11" — clave del mes para agrupar ventas (cada mes empieza en cero).
export function claveMes(fecha = new Date()) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
}

// ══════════════════════════════════════════════════
// RESUMEN MENSUAL DE UN VENDEDOR (Fase 6 — RF-14, RS-07, RS-08)
// registros: ventas en persona y pedidos web del vendedor, normalizados:
//   { tipo: "venta"|"pedido", fecha: Date, monto, estado,
//     historial: [{ estado, fecha: Date }] }
// - Una venta cuenta en el mes de su FECHA, solo si está pagada (RS-07).
// - Devoluciones/cancelaciones de algo que ya estaba pagado en un mes
//   ANTERIOR cuyo pago de comisión ya se hizo, se descuentan en el mes en
//   que se devolvió (RS-08). Si ese mes todavía no se pagó, no hace falta
//   descontar: ese mes ya no la cuenta al recalcularse.
// mesesPagados: Set de "AAAA-MM" con la comisión ya pagada.
// ══════════════════════════════════════════════════
export const ESTADOS_PAGADOS = ["pagada", "pagado", "en_camino", "entregado"];
const ESTADOS_ANULADOS = ["devuelta", "cancelada", "cancelado"];

export function resumenMes(registros, mes, cfg = NEGOCIO_POR_DEFECTO, mesesPagados = new Set()) {
  let total = 0, comisionTotal = 0, ajuste = 0, pagadas = 0, pendientes = 0;
  const devoluciones = [];
  for (const r of registros) {
    const delMes = r.fecha && claveMes(r.fecha) === mes;
    if (delMes && ESTADOS_PAGADOS.includes(r.estado)) {
      total += Number(r.monto) || 0;
      comisionTotal += comision(r.monto, cfg);
      pagadas++;
    } else if (delMes && !ESTADOS_ANULADOS.includes(r.estado)) {
      pendientes++;
    }
    // Devolución de algo pagado en un mes anterior ya liquidado
    if (ESTADOS_ANULADOS.includes(r.estado) && r.fecha && claveMes(r.fecha) < mes) {
      const h = r.historial || [];
      const anulada = h.find((x) => ESTADOS_ANULADOS.includes(x.estado) && x.fecha && claveMes(x.fecha) === mes);
      const estuvoPagada = h.some((x) => ESTADOS_PAGADOS.includes(x.estado));
      if (anulada && estuvoPagada && mesesPagados.has(claveMes(r.fecha))) {
        const c = comision(r.monto, cfg);
        ajuste += c;
        devoluciones.push({ monto: Number(r.monto) || 0, comision: c, mesOriginal: claveMes(r.fecha) });
      }
    }
  }
  comisionTotal = redondear(comisionTotal);
  ajuste = redondear(ajuste);
  const avance = avanceMeta(total, cfg);
  return {
    mes, total: avance.total, pagadas, pendientes,
    comision: comisionTotal, ajusteDevoluciones: ajuste,
    aPagar: redondear(Math.max(0, comisionTotal - ajuste)),
    saldoEnContra: redondear(Math.max(0, ajuste - comisionTotal)), // se descuenta el mes siguiente
    devoluciones, meta: avance.meta, pct: avance.pct,
    bono: avance.alcanzado ? avance.alcanzado.texto : null,
    avance
  };
}

// ══════════════════════════════════════════════════
// MARGEN BRUTO ESTIMADO (Fase 7 — RF-20, informativo; solo admin)
// registros: como en resumenMes, más `ingreso` (lo que pagó el cliente por
// las piezas, sin envío) y `piezas: [{ codigo, cantidad }]`.
// costos: { codigo: costo unitario }. Las piezas sin costo cargado no se
// pueden estimar: se cuentan en `sinCosto` y su registro queda fuera.
// No limita ni bloquea nada: es para que el dueño vea si el bono conviene.
// ══════════════════════════════════════════════════
export function margenMes(registros, mes, costos = {}, cfg = NEGOCIO_POR_DEFECTO) {
  let ingreso = 0, costo = 0, sinCosto = 0, incluidos = 0;
  for (const r of registros) {
    if (!r.fecha || claveMes(r.fecha) !== mes || !ESTADOS_PAGADOS.includes(r.estado)) continue;
    const piezas = r.piezas || [];
    const tieneCosto = (c) => costos[c] !== undefined && costos[c] !== null && Number(costos[c]) >= 0;
    const faltan = piezas.filter((p) => !tieneCosto(p.codigo));
    if (!piezas.length || faltan.length) { sinCosto += faltan.length || 1; continue; }
    ingreso += Number(r.ingreso) || 0;
    costo += piezas.reduce((s, p) => s + Number(costos[p.codigo]) * (Number(p.cantidad) || 0), 0);
    incluidos++;
  }
  const margen = redondear(ingreso - costo);
  const total = registros.filter((r) => r.fecha && claveMes(r.fecha) === mes && ESTADOS_PAGADOS.includes(r.estado))
    .reduce((s, r) => s + (Number(r.monto) || 0), 0);
  const b = avanceMeta(total, cfg).alcanzado;
  const valorBono = b ? Number(b.valor) || 0 : 0;
  return {
    ingreso: redondear(ingreso), costo: redondear(costo), margen, incluidos, sinCosto,
    valorBono, bonoPctMargen: valorBono && margen > 0 ? Math.round((valorBono / margen) * 1000) / 10 : null
  };
}
