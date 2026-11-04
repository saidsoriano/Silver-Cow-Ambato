// ══════════════════════════════════════════════════
// CRUD DEL CATÁLOGO — listar, editar, archivar/desarchivar
// Fase 3 de spec/features/010-vista-admin/tasks.md
// ══════════════════════════════════════════════════
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
import { db } from "./firebase-config.js";
import { subirFoto } from "./fotos.js";

// Mismas etiquetas que ya usa catalogo_motor.js:58-62, para que el
// panel hable el mismo idioma que el sitio público.
const CATEGORIAS = {
  aretes: "Aretes",
  anillos: "Anillos",
  dijes: "Dijes",
  pulseras: "Pulseras",
  cadenas: "Cadenas",
  juegos: "Juegos",
  cadenas_dijes: "Cadenas con Dijes"
};

const tabs = document.getElementById("catTabs");
const lista = document.getElementById("listaProductos");
const estadoLista = document.getElementById("estadoLista");
const buscador = document.getElementById("buscador");
const filtrosEstado = document.getElementById("filtrosEstado");

// Pestaña especial, fuera de CATEGORIAS: junta piezas de todas las
// categorías marcadas "destacada", para ver de un vistazo qué está
// activo en el carrusel del sitio público sin recorrer pestaña por pestaña.
const TAB_DESTACADAS = "destacadas";

let categoriaActiva = "aretes";

function armarTabs() {
  tabs.innerHTML = "";
  const entradas = [[TAB_DESTACADAS, "★ Destacadas"], ...Object.entries(CATEGORIAS)];
  entradas.forEach(([cat, label]) => {
    const btn = document.createElement("button");
    btn.className = "admin-tab" + (cat === categoriaActiva ? " activa" : "");
    btn.setAttribute("aria-selected", cat === categoriaActiva ? "true" : "false");
    btn.textContent = label;
    btn.addEventListener("click", () => {
      if (cat === categoriaActiva) return;
      if (hayCambiosSinGuardar() && !confirm(
        "Tenés cambios sin guardar en esta pestaña. Si cambiás ahora se pierden. ¿Continuar?"
      )) return;
      categoriaActiva = cat;
      armarTabs();
      cargarCategoria(cat);
    });
    tabs.appendChild(btn);
  });
}

async function cargarCategoria(cat) {
  lista.innerHTML = "";
  estadoLista.hidden = false;
  estadoLista.textContent = "Cargando...";

  try {
    // "Destacadas" no filtra por categoría: un solo filtro de igualdad
    // (igual que cada pestaña normal), así no hace falta un índice
    // compuesto nuevo — mismo criterio que firestore-catalogo.js.
    const q = cat === TAB_DESTACADAS
      ? query(collection(db, "productos"), where("destacada", "==", true))
      : query(collection(db, "productos"), where("categoria", "==", cat), orderBy("nombre"));
    const snap = await getDocs(q);

    if (snap.empty) {
      estadoLista.textContent = cat === TAB_DESTACADAS
        ? "No hay piezas destacadas todavía — marcá el casillero en cualquier categoría."
        : "No hay productos en esta categoría.";
      return;
    }

    estadoLista.hidden = true;
    snap.forEach((docSnap) => lista.appendChild(filaProducto(docSnap.id, docSnap.data())));
    filtrarLista(); // por si había texto en el buscador al cambiar de pestaña
  } catch (err) {
    console.error("admin/productos: cargarCategoria", err);
    estadoLista.textContent = "Error al cargar: " + err.message;
  }
}

// Antes de cambiar de pestaña (categoría o "★ Destacadas"): si alguna
// fila visible tiene una edición sin guardar, avisa en vez de descartarla
// en silencio (cargarCategoria() reconstruye toda la lista desde cero).
function hayCambiosSinGuardar() {
  return Array.from(lista.querySelectorAll(".admin-fila")).some(
    (f) => typeof f.tieneCambiosSinGuardar === "function" && f.tieneCambiosSinGuardar()
  );
}

function filaProducto(codigo, p) {
  const fila = document.createElement("div");
  fila.className = "admin-fila" + (p.archivado ? " archivada" : "");

  fila.innerHTML = `
    <div class="admin-fila-foto">
      <img class="admin-fila-img" src="${escaparAtributo(rutaImagen(p.img))}" alt=""
           onerror="this.style.visibility='hidden'">
      <label class="admin-cambiar-foto">
        Cambiar foto
        <input type="file" accept="image/jpeg,image/png,image/webp" hidden class="admin-input-foto">
      </label>
    </div>
    <div class="admin-fila-campos">
      <div class="admin-fila-codigo">${escaparTexto(codigo)}</div>

      <label class="admin-label">Nombre</label>
      <input class="admin-input admin-input-nombre" type="text" value="${escaparAtributo(p.nombre)}">

      <div class="admin-fila-linea2">
        <div class="admin-campo">
          <label class="admin-label">Precio (USD)</label>
          <input class="admin-input admin-input-precio" type="number" step="0.01" min="0" value="${p.precio}">
        </div>
        <div class="admin-campo admin-campo-flex">
          <label class="admin-label">Estado</label>
          <select class="admin-select">
            <option value="disponible" ${p.estado === "disponible" ? "selected" : ""}>Disponible</option>
            <option value="pedido" ${p.estado === "pedido" ? "selected" : ""}>Bajo pedido</option>
            <option value="agotado" ${p.estado === "agotado" ? "selected" : ""}>Agotado</option>
          </select>
        </div>
        <div class="admin-campo">
          <label class="admin-label">Destacada</label>
          <label class="admin-check">
            <input type="checkbox" class="admin-input-destacada" ${p.destacada ? "checked" : ""}>
            Mostrar en "Piezas destacadas"
          </label>
        </div>
      </div>

      <label class="admin-label">Descripción</label>
      <textarea class="admin-input admin-input-desc" rows="2">${escaparTexto(descSinCodigo(p.desc))}</textarea>
    </div>
    <div class="admin-fila-acciones">
      <button class="admin-btn-mini admin-btn-guardar">Guardar</button>
      <button class="admin-btn-mini admin-btn-archivar">${p.archivado ? "Desarchivar" : "Archivar"}</button>
      <span class="admin-fila-ok" hidden>✓</span>
    </div>
  `;

  const imgFila = fila.querySelector(".admin-fila-img");
  const inputFoto = fila.querySelector(".admin-input-foto");
  const labelFoto = fila.querySelector(".admin-cambiar-foto");

  inputFoto.addEventListener("change", async () => {
    const archivo = inputFoto.files[0];
    if (!archivo) return;
    const textoOriginal = labelFoto.firstChild.textContent;
    labelFoto.firstChild.textContent = "Subiendo...";
    labelFoto.classList.add("subiendo");
    try {
      const url = await subirFoto(codigo, archivo);
      await updateDoc(doc(db, "productos", codigo), {
        img: url,
        actualizado: serverTimestamp()
      });
      imgFila.style.visibility = "visible";
      imgFila.src = url;
      p.img = url;
      labelFoto.firstChild.textContent = "¡Listo!";
      setTimeout(() => (labelFoto.firstChild.textContent = textoOriginal), 1500);
    } catch (err) {
      console.error("admin/productos: subirFoto", codigo, err);
      alert("No se pudo subir la foto: " + err.message);
      labelFoto.firstChild.textContent = textoOriginal;
    } finally {
      labelFoto.classList.remove("subiendo");
      inputFoto.value = "";
    }
  });

  const inputNombre = fila.querySelector(".admin-input-nombre");
  const inputPrecio = fila.querySelector(".admin-input-precio");
  const selectEstado = fila.querySelector(".admin-select");
  const inputDestacada = fila.querySelector(".admin-input-destacada");
  const inputDesc = fila.querySelector(".admin-input-desc");
  const btnGuardar = fila.querySelector(".admin-btn-guardar");
  const btnArchivar = fila.querySelector(".admin-btn-archivar");
  const marcaOk = fila.querySelector(".admin-fila-ok");

  // Compara contra `p` (los últimos valores guardados en Firestore) para
  // saber si hay ediciones sin guardar — lo usa hayCambiosSinGuardar()
  // antes de dejar cambiar de pestaña.
  fila.tieneCambiosSinGuardar = function () {
    return (
      inputNombre.value.trim() !== (p.nombre || "") ||
      (Number(inputPrecio.value) || 0) !== (p.precio || 0) ||
      selectEstado.value !== p.estado ||
      inputDestacada.checked !== !!p.destacada ||
      inputDesc.value.trim() !== descSinCodigo(p.desc)
    );
  };

  btnGuardar.addEventListener("click", async () => {
    btnGuardar.disabled = true;
    try {
      // El código vuelve a anteponerse entre corchetes: crearTarjeta()
      // (catalogo_motor.js) espera encontrarlo ahí para mostrarlo y
      // armar el mensaje de WhatsApp — ver plan.md § Modelo de datos.
      const descConCodigo = `[${codigo}] ${inputDesc.value.trim()}`;
      await updateDoc(doc(db, "productos", codigo), {
        nombre: inputNombre.value.trim(),
        precio: Number(inputPrecio.value) || 0,
        estado: selectEstado.value,
        destacada: inputDestacada.checked,
        desc: descConCodigo,
        actualizado: serverTimestamp()
      });
      // Sincroniza `p` con lo recién guardado — si no, tieneCambiosSinGuardar()
      // seguiría viendo esta fila como "sucia" después de guardar.
      p.nombre = inputNombre.value.trim();
      p.precio = Number(inputPrecio.value) || 0;
      p.estado = selectEstado.value;
      p.destacada = inputDestacada.checked;
      p.desc = descConCodigo;

      marcaOk.hidden = false;
      setTimeout(() => (marcaOk.hidden = true), 1500);

      // En "★ Destacadas" la fila deja de pertenecer a la vista si se
      // desmarcó — se saca sola, para que la lista siempre refleje lo
      // que está activo ahora mismo.
      if (categoriaActiva === TAB_DESTACADAS && !inputDestacada.checked) {
        setTimeout(() => {
          fila.remove();
          if (!lista.children.length) {
            estadoLista.hidden = false;
            estadoLista.textContent = "No hay piezas destacadas todavía — marcá el casillero en cualquier categoría.";
          }
        }, 900);
      }
    } catch (err) {
      console.error("admin/productos: guardar", codigo, err);
      alert("No se pudo guardar: " + err.message);
    } finally {
      btnGuardar.disabled = false;
    }
  });

  btnArchivar.addEventListener("click", async () => {
    const nuevoValor = !p.archivado;
    btnArchivar.disabled = true;
    try {
      await updateDoc(doc(db, "productos", codigo), {
        archivado: nuevoValor,
        actualizado: serverTimestamp()
      });
      p.archivado = nuevoValor;
      fila.classList.toggle("archivada", nuevoValor);
      btnArchivar.textContent = nuevoValor ? "Desarchivar" : "Archivar";
    } catch (err) {
      console.error("admin/productos: archivar", codigo, err);
      alert("No se pudo cambiar: " + err.message);
    } finally {
      btnArchivar.disabled = false;
    }
  });

  return fila;
}

// img puede venir como ruta relativa del sitio público ("anillos/foto.jpg")
// o, para piezas nuevas, como URL completa de Supabase. admin.html vive en
// la raíz del repo, igual que index.html, así que la ruta relativa se usa
// tal cual, sin prefijo.
function rutaImagen(img) {
  return img || "";
}

// Quita el "[P-AN-368] " del principio para mostrar/editar la descripción
// limpia — mismo patrón que catalogo_motor.js:139 (descLimpia).
function descSinCodigo(desc) {
  return String(desc ?? "").replace(/^\[[^\]]+\]\s*/, "");
}

function escaparTexto(s) {
  return String(s ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}
function escaparAtributo(s) {
  return escaparTexto(s).replace(/"/g, "&quot;");
}

// Filtro por estado (botones "Disponible" / "Bajo pedido" / "Agotado",
// combinables): ninguno activo = se muestran todos. Se guarda acá mismo,
// sin tocar Firestore — es solo cómo se ve la lista ya cargada.
const estadosActivos = new Set();

function alternarFiltroEstado(btn) {
  const estado = btn.dataset.estado;
  if (estadosActivos.has(estado)) {
    estadosActivos.delete(estado);
    btn.classList.remove("activo");
    btn.setAttribute("aria-pressed", "false");
  } else {
    estadosActivos.add(estado);
    btn.classList.add("activo");
    btn.setAttribute("aria-pressed", "true");
  }
  filtrarLista();
}
filtrosEstado.querySelectorAll(".admin-filtro").forEach((btn) => {
  btn.addEventListener("click", () => alternarFiltroEstado(btn));
});

// Filtro client-side sobre lo ya cargado de la categoría actual — no
// hace falta volver a consultar Firestore para esto. Combina texto y
// estado: una fila se muestra solo si pasa los dos filtros a la vez.
function filtrarLista() {
  const texto = normalizar(buscador.value);
  lista.querySelectorAll(".admin-fila").forEach((fila) => {
    const nombre = normalizar(fila.querySelector(".admin-input-nombre").value);
    const codigo = normalizar(fila.querySelector(".admin-fila-codigo").textContent);
    const estado = fila.querySelector(".admin-select").value;
    const coincideTexto = !texto || nombre.includes(texto) || codigo.includes(texto);
    const coincideEstado = estadosActivos.size === 0 || estadosActivos.has(estado);
    fila.hidden = !(coincideTexto && coincideEstado);
  });
}
function normalizar(s) {
  // NFD separa "é" en "e" + marca de acento; el replace saca esa marca
  // (rango Unicode ̀-ͯ) para que buscar "anillo" encuentre
  // también "Anillo Corazón". Escape explícito, no el carácter literal.
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
buscador.addEventListener("input", filtrarLista);

// Cuando alta.js agrega una pieza en la categoría que está abierta,
// recarga la lista para que aparezca sin que el propietario tenga que
// cambiar de pestaña y volver.
document.addEventListener("admin:pieza-agregada", (ev) => {
  if (ev.detail?.categoria === categoriaActiva) cargarCategoria(categoriaActiva);
});

armarTabs();
cargarCategoria(categoriaActiva);
