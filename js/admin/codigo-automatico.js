// ══════════════════════════════════════════════════
// CÓDIGO AUTOMÁTICO — siguiente número libre por categoría
// Fase 5 de spec/features/010-vista-admin/tasks.md
//
// Prefijos verificados contra el catálogo real (357 productos), no de
// memoria. Ver sesion-022.
// ══════════════════════════════════════════════════
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

export const PREFIJOS = {
  aretes: "P-AR-",
  anillos: "P-AN-",
  dijes: "P-DJ-",
  pulseras: "P-PL-",
  cadenas: "P-CD-",
  juegos: "P-JU-",
  cadenas_dijes: "P-CDD-"
};

/**
 * Devuelve el siguiente código libre de una categoría, ej. "P-AN-369".
 * Revisa todos los documentos existentes de esa categoría (incluidos
 * los archivados, para no reusar un número ya dado) y toma el mayor
 * número encontrado + 1.
 */
export async function siguienteCodigo(categoria) {
  const prefijo = PREFIJOS[categoria];
  if (!prefijo) throw new Error("Categoría desconocida: " + categoria);

  const q = query(collection(db, "productos"), where("categoria", "==", categoria));
  const snap = await getDocs(q);

  let max = 0;
  snap.forEach((docSnap) => {
    const codigo = docSnap.id; // ej. "P-AN-118"
    if (!codigo.startsWith(prefijo)) return;
    const numero = parseInt(codigo.slice(prefijo.length), 10);
    if (!isNaN(numero) && numero > max) max = numero;
  });

  return prefijo + (max + 1);
}
