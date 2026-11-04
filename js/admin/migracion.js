// ══════════════════════════════════════════════════
// IMPORTAR DESDE SHEETS — migración de un solo uso
// Lee el mismo endpoint público que ya usa catalogo.js (sin tocarlo) y
// crea un documento en Firestore por cada producto. Pensado para
// correrse una vez; volver a correrlo sobrescribe los documentos
// existentes con los mismos datos (mismo ID = mismo código), no los
// duplica.
// Ver spec/features/010-vista-admin/plan.md § Migración.
// ══════════════════════════════════════════════════
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

// Mismo endpoint que catalogo.js:6 — se repite acá porque admin.html no
// carga catalogo.js (son paneles separados a propósito).
const SHEETS_URL = "https://script.google.com/macros/s/AKfycbwN-2Ee7YTiKae_PIr2SjMETDqL6y-u-Hi135y0xc9v1i2gk1SUNijUUR7OUJi4u48d/exec?v=1";

const btnMigrar = document.getElementById("btnMigrar");
const estadoMigracion = document.getElementById("estadoMigracion");

if (btnMigrar) {
  btnMigrar.addEventListener("click", migrar);
}

async function migrar() {
  const confirmado = confirm(
    "Esto vuelve a importar TODO el catálogo desde Google Sheets.\n\n" +
    "No borra piezas, pero si un producto ya existe en Firestore, " +
    "se actualizan sus datos de Sheets (nombre, precio, estado, foto, " +
    "descripción) sin tocar \"Destacada\" ni \"Archivado\" — eso se " +
    "respeta tal como está.\n\n¿Continuar?"
  );
  if (!confirmado) return;

  btnMigrar.disabled = true;
  estadoMigracion.hidden = false;
  estadoMigracion.textContent = "Descargando catálogo de Sheets...";

  try {
    const resp = await fetch(SHEETS_URL);
    if (!resp.ok) throw new Error("Sheets respondió " + resp.status);
    const catalogo = await resp.json(); // { aretes: [...], anillos: [...], ... }

    const categorias = Object.keys(catalogo);
    let total = 0;
    const porCategoria = {};

    // Firestore permite hasta 500 escrituras por lote — con 357
    // productos entra en un solo batch, pero se divide en bloques de
    // 400 por si el catálogo crece.
    const TAMANO_LOTE = 400;
    let productos = [];
    for (const cat of categorias) {
      const items = catalogo[cat] || [];
      porCategoria[cat] = items.length;
      for (const p of items) productos.push({ ...p, categoria: cat });
    }

    estadoMigracion.textContent = `Guardando ${productos.length} productos en Firestore...`;

    for (let i = 0; i < productos.length; i += TAMANO_LOTE) {
      const lote = productos.slice(i, i + TAMANO_LOTE);
      const batch = writeBatch(db);
      for (const p of lote) {
        const codigo = (p.codigo || "").replace(/[\[\]]/g, "").trim();
        if (!codigo) continue; // sin código no hay forma de usarlo como ID
        const ref = doc(collection(db, "productos"), codigo);
        // merge:true + sin "archivado"/"destacada" acá: si el producto ya
        // existe, lo curado a mano desde el panel (destacar una pieza,
        // archivarla) no se pisa con los datos de Sheets. Si es nuevo,
        // ambos quedan sin definir — se tratan como "no" en todo el sitio
        // (filtros con !p.archivado / if (p.destacada)).
        batch.set(ref, {
          nombre: p.nombre || "",
          categoria: p.categoria,
          precio: Number(p.precio) || 0,
          estado: p.estado || "pedido",
          esPedido: !!p.esPedido,
          desc: p.desc || "",
          img: p.img || "",
          actualizado: serverTimestamp()
        }, { merge: true });
        total++;
      }
      await batch.commit();
    }

    const resumen = categorias
      .map((c) => `${c}: ${porCategoria[c]}`)
      .join(" · ");
    estadoMigracion.textContent =
      `Listo. ${total} productos importados (${categorias.length} categorías). ${resumen}`;
  } catch (err) {
    console.error("admin/migracion:", err);
    estadoMigracion.textContent = "Error: " + err.message;
  } finally {
    btnMigrar.disabled = false;
  }
}
