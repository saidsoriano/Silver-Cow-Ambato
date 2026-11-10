// Pruebas de js/vendedor/negocio.js con los ejemplos del doc de requerimientos
// y los bordes de los tramos. Uso: node scripts/test-comisiones.mjs
import { comision, avanceMeta, resumenMes, margenMes } from "../js/vendedor/negocio.js";
let ok = 0, mal = 0;
const t = (nombre, real, esperado) => {
  const bien = JSON.stringify(real) === JSON.stringify(esperado);
  bien ? ok++ : mal++;
  console.log(bien ? "OK  " : "FAIL", nombre, "→", real, bien ? "" : `(esperado ${esperado})`);
};
// Ejemplos del doc
t("$25 con código 5% → paga $23.75 → 10%", comision(23.75), 2.38);
t("$25 con descuento de $5 → paga $20 → 10%", comision(20), 2);
// Bordes (el límite es del tramo de abajo)
t("$9.99 sin comisión", comision(9.99), 0);
t("$10 → $2 fijos", comision(10), 2);
t("$15 → $2 fijos (primer tramo)", comision(15), 2);
t("$15.01 → 10%", comision(15.01), 1.5);
t("$40 → 10%", comision(40), 4);
t("$40.01 → 8%", comision(40.01), 3.2);
t("$90 → 8%", comision(90), 7.2);
t("$90.01 → 6%", comision(90.01), 5.4);
t("$200 → 6%", comision(200), 12);
t("$0 → 0", comision(0), 0);
// Meta
const a = avanceMeta(0);   t("meta $0 → 0%", [a.pct, a.alcanzado, a.faltaParaProximo], [0, null, 50]);
const b = avanceMeta(30);  t("meta $30 → 60%", [b.pct, b.faltaParaProximo], [60, 20]);
const c = avanceMeta(50);  t("meta $50 → 100% + bono 1", [c.pct, c.alcanzado.desde, c.faltaParaProximo], [100, 50, 50]);
const d = avanceMeta(120); t("meta $120 → bono 2, sin próximo", [d.alcanzado.desde, d.proximo], [100, null]);
// Resumen mensual
const F = (s) => new Date(s + "T12:00:00");
const regs = [
  { tipo: "venta", fecha: F("2026-11-03"), monto: 23.75, estado: "pagada", historial: [] },          // $2.38
  { tipo: "pedido", fecha: F("2026-11-05"), monto: 6.65, estado: "entregado", historial: [] },       // <$10: $0
  { tipo: "venta", fecha: F("2026-11-06"), monto: 30, estado: "pendiente", historial: [] },          // no cuenta
  { tipo: "venta", fecha: F("2026-11-07"), monto: 40, estado: "cancelada", historial: [] },          // no cuenta
  { tipo: "venta", fecha: F("2026-10-20"), monto: 20, estado: "devuelta",                            // de octubre, devuelta en nov
    historial: [{ estado: "pagada", fecha: F("2026-10-21") }, { estado: "devuelta", fecha: F("2026-11-02") }] },
  { tipo: "venta", fecha: F("2026-12-01"), monto: 100, estado: "pagada", historial: [] }              // otro mes
];
const nov = resumenMes(regs, "2026-11", undefined, new Set(["2026-10"]));
t("nov: total pagado", nov.total, 30.4);
t("nov: comisión ($2.38 + $0)", nov.comision, 2.38);
t("nov: 2 pagadas, 1 pendiente", [nov.pagadas, nov.pendientes], [2, 1]);
t("nov: descuenta devolución de oct ya pagada ($2)", nov.ajusteDevoluciones, 2);
t("nov: a pagar $0.38", nov.aPagar, 0.38);
t("nov: meta 61%, sin bono", [nov.pct, nov.bono], [61, null]);
const novSinPagarOct = resumenMes(regs, "2026-11", undefined, new Set());
t("si octubre no se pagó, no se descuenta", novSinPagarOct.ajusteDevoluciones, 0);
const oct = resumenMes(regs, "2026-10");
t("oct recalculado ya no cuenta la devuelta", [oct.total, oct.comision], [0, 0]);
const dic = resumenMes(regs, "2026-12");
t("dic: $100 → 6% = $6, bono 2", [dic.comision, dic.bono !== null, dic.pct], [6, true, 100]);
// Margen (RF-20)
const mreg = [
  { fecha: F("2026-11-03"), estado: "pagada", monto: 47.5, ingreso: 47.5, piezas: [{ codigo: "A", cantidad: 2 }] },   // costo 2×8
  { fecha: F("2026-11-04"), estado: "entregado", monto: 60, ingreso: 55, piezas: [{ codigo: "B", cantidad: 1 }] },  // costo 20 (envío fuera)
  { fecha: F("2026-11-05"), estado: "pagada", monto: 30, ingreso: 30, piezas: [{ codigo: "Z", cantidad: 1 }] },     // sin costo
  { fecha: F("2026-11-06"), estado: "pendiente", monto: 99, ingreso: 99, piezas: [{ codigo: "A", cantidad: 1 }] }   // no cuenta
];
const m = margenMes(mreg, "2026-11", { A: 8, B: 20 });
t("margen: ingreso/costo/margen", [m.ingreso, m.costo, m.margen], [102.5, 36, 66.5]);
t("margen: 1 sin costo, 2 incluidas", [m.sinCosto, m.incluidos], [1, 2]);
t("margen: total $137.5 → bono 2 ($15) = 22.6% del margen", [m.valorBono, m.bonoPctMargen], [15, 22.6]);
t("margen: costo 0 es válido", margenMes([{ fecha: F("2026-11-03"), estado: "pagada", monto: 10, ingreso: 10, piezas: [{ codigo: "C", cantidad: 1 }] }], "2026-11", { C: 0 }).margen, 10);
console.log(`\n${ok} ok / ${mal} fallos`);
process.exit(mal ? 1 : 0);
