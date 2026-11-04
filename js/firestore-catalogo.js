// ══════════════════════════════════════════════════
// CATÁLOGO DESDE FIRESTORE — fuente de datos para el sitio público
// Fase 6 de spec/features/010-vista-admin/tasks.md
//
// Reemplaza, para catalogo.js, el fetch(SHEETS_URL) por una consulta a
// Firestore. Produce exactamente la misma forma de datos que el viejo
// endpoint de Sheets — { categoria: [producto, producto, ...] } — para
// que catalogo_motor.js no note ninguna diferencia.
//
// Es un módulo ES (import/export) a propósito, pero catalogo.js es un
// script clásico que corre de inmediato — por eso expone la función en
// `window` en vez de que catalogo.js lo importe: así no hace falta
// convertir catalogo.js en módulo, lo que rompería el contrato de
// catalogo_motor.js (lee `CATALOGO` como variable global; un script
// módulo no la expondría así sin más cambios).
// ══════════════════════════════════════════════════
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
import { db } from "./admin/firebase-config.js";

// Mismo orden que ya usaba Sheets — no afecta el render (catalogo_motor.js
// reordena cada categoría por estado al pintar), pero mantiene el objeto
// final predecible.
const CATEGORIAS = ["aretes", "anillos", "dijes", "pulseras", "cadenas", "juegos", "cadenas_dijes"];

window.obtenerCatalogoFirestore = async function obtenerCatalogoFirestore() {
  const resultado = {};

  await Promise.all(
    CATEGORIAS.map(async (cat) => {
      // Un solo filtro de igualdad — no necesita índice compuesto. El
      // filtro de "archivado" se hace acá mismo en JS, no en la
      // consulta, para no tener que crear (y esperar a que compile) un
      // segundo índice solo por esto.
      const q = query(collection(db, "productos"), where("categoria", "==", cat));
      const snap = await getDocs(q);
      resultado[cat] = snap.docs
        .map((d) => d.data())
        .filter((p) => !p.archivado)
        .map((p) => ({
          nombre: p.nombre,
          precio: p.precio,
          estado: p.estado,
          esPedido: p.esPedido,
          desc: p.desc,
          img: p.img
        }));
    })
  );

  return resultado;
};
