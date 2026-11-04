// ══════════════════════════════════════════════════
// AGREGAR PIEZA NUEVA — formulario de alta
// Fase 5 de spec/features/010-vista-admin/tasks.md
// ══════════════════════════════════════════════════
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { subirFoto } from "./fotos.js";
import { siguienteCodigo, PREFIJOS } from "./codigo-automatico.js";

const btnAbrir = document.getElementById("btnAbrirAlta");
const btnCerrar = document.getElementById("btnCerrarAlta");
const form = document.getElementById("formAlta"); // el form ES el panel que se muestra/oculta
const selectCategoria = document.getElementById("altaCategoria");
const previewCodigo = document.getElementById("altaCodigoPreview");
const estadoAlta = document.getElementById("estadoAlta");
const btnGuardarAlta = document.getElementById("btnGuardarAlta");

btnAbrir.addEventListener("click", () => {
  form.hidden = false;
  btnAbrir.hidden = true;
  actualizarPreviewCodigo();
});
btnCerrar.addEventListener("click", cerrarFormulario);

function formularioTieneContenido() {
  return (
    document.getElementById("altaNombre").value.trim() !== "" ||
    document.getElementById("altaPrecio").value !== "" ||
    document.getElementById("altaDescripcion").value.trim() !== "" ||
    document.getElementById("altaFoto").files.length > 0
  );
}

function cerrarFormulario() {
  if (formularioTieneContenido() && !confirm(
    "Vas a perder lo que escribiste en esta pieza. ¿Cerrar igual?"
  )) return;
  form.hidden = true;
  btnAbrir.hidden = false;
  form.reset();
  estadoAlta.hidden = true;
}

selectCategoria.addEventListener("change", actualizarPreviewCodigo);

async function actualizarPreviewCodigo() {
  const cat = selectCategoria.value;
  if (!cat) {
    previewCodigo.textContent = "";
    return;
  }
  previewCodigo.textContent = "Calculando código...";
  try {
    const codigo = await siguienteCodigo(cat);
    previewCodigo.textContent = "Código: " + codigo;
  } catch (err) {
    previewCodigo.textContent = "No se pudo calcular el código.";
    console.error("admin/alta: actualizarPreviewCodigo", err);
  }
}

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();

  const categoria = selectCategoria.value;
  const nombre = document.getElementById("altaNombre").value.trim();
  const precio = Number(document.getElementById("altaPrecio").value);
  const estado = document.getElementById("altaEstado").value;
  const descripcion = document.getElementById("altaDescripcion").value.trim();
  const archivo = document.getElementById("altaFoto").files[0];

  if (!categoria) return mostrarError("Elegí una categoría.");
  if (!nombre) return mostrarError("Ponele un nombre a la pieza.");
  if (!precio || precio <= 0) return mostrarError("El precio tiene que ser mayor a 0.");
  if (!archivo) return mostrarError("Subí una foto — toda pieza necesita una.");

  btnGuardarAlta.disabled = true;
  estadoAlta.hidden = false;
  estadoAlta.className = "";

  try {
    estadoAlta.textContent = "Generando código...";
    const codigo = await siguienteCodigo(categoria);

    estadoAlta.textContent = `Subiendo foto (${codigo})...`;
    const img = await subirFoto(codigo, archivo);

    estadoAlta.textContent = "Guardando pieza...";
    await setDoc(doc(db, "productos", codigo), {
      nombre,
      categoria,
      precio,
      estado,
      esPedido: estado === "pedido",
      desc: `[${codigo}] ${descripcion}`,
      img,
      archivado: false,
      actualizado: serverTimestamp()
    });

    estadoAlta.textContent = `Listo — ${codigo} agregado al catálogo.`;
    estadoAlta.className = "admin-alta-ok";
    form.reset();

    // Si la categoría recién creada es la que está abierta en la lista,
    // la recarga para que aparezca sin tener que cambiar de pestaña.
    document.dispatchEvent(new CustomEvent("admin:pieza-agregada", { detail: { categoria } }));

    setTimeout(cerrarFormulario, 1800);
  } catch (err) {
    console.error("admin/alta: guardar pieza", err);
    mostrarError("No se pudo guardar: " + err.message);
  } finally {
    btnGuardarAlta.disabled = false;
  }
});

function mostrarError(msg) {
  estadoAlta.hidden = false;
  estadoAlta.textContent = msg;
  estadoAlta.className = "admin-alta-error";
}
