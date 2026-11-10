// ══════════════════════════════════════════════════
// PANEL DEL VENDEDOR — login + meta + código + ventas + catálogo
// Feature 012-paneles-vendedores, Fase 3.
//
// Acceso: Firebase Auth con correo interno <usuario>@silvercow.app (el
// vendedor solo escribe "dome"). Después del login se lee roles/{uid}: sin
// rol de vendedor activo, no entra. Las reglas de Firestore repiten esa
// misma condición del lado del servidor — esta pantalla solo explica.
//
// Contrato de datos que esta pantalla lee (lo escriben las Fases 4 y 5):
//   ventas/{id}            sellerId, fecha (timestamp), precioFinal, estado,
//                          piezas, descripcion (opcional)
//   pedidos_vendedor/{cod} sellerId, codigo, monto, estado, fecha
// Estados que cuentan para la meta: ver ESTADOS_PAGADOS.
// ══════════════════════════════════════════════════
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import {
  doc, getDoc, collection, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";
import { auth, db } from "../admin/firebase-config.js";
import { armarConfig, comision, avanceMeta, claveMes, resumenMes } from "./negocio.js";
import { iniciarVenta } from "./venta.js";
import "../firestore-catalogo.js"; // expone window.obtenerCatalogoFirestore

const DOMINIO = "silvercow.app";
// La meta suma ventas pagadas (RS-06/RS-09); pagado y lo que viene después.
const ESTADOS_PAGADOS = ["pagada", "pagado", "en_camino", "entregado"];
const ETIQUETA_ESTADO = {
  sin_confirmar: "Sin confirmar", nuevo: "Nuevo", confirmado: "Confirmado",
  pendiente: "Pendiente", confirmada: "Confirmada", pagada: "Pagada", pagado: "Pagado",
  en_camino: "En camino", entregado: "Entregado", cancelado: "Cancelado",
  cancelada: "Cancelada", devuelta: "Devuelta"
};

const $ = (id) => document.getElementById(id);
const pantallas = [$("pantallaLogin"), $("pantallaRechazo"), $("pantallaPanel")];
// Muestra una sola de las 3 pantallas (login / sin acceso / panel).
function mostrar(p) {
  pantallas.forEach((x) => (x.hidden = x !== p));
  document.body.classList.toggle("vend-en-panel", p === $("pantallaPanel"));
}
const usd = (n) => "$" + (Number(n) || 0).toFixed(2);
// Escapa texto antes de meterlo en HTML (evita inyectar etiquetas).
function escapar(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
// Minúsculas y sin acentos, para que el buscador encuentre "anillo" en "Ánillo".
function normalizar(s) {
  return String(s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// ── Login ──
const form = $("formLogin");
const inUsuario = $("loginUsuario");
const inClave = $("loginClave");
const btnLogin = $("btnLogin");
const err = $("loginError");

// Traduce los códigos de error de Firebase Auth a mensajes claros en español.
function mensajeError(code) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "Usuario o contraseña incorrectos.";
    case "auth/user-disabled":
      return "Tu cuenta está desactivada. Habla con el administrador.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera unos minutos y vuelve a probar.";
    case "auth/network-request-failed":
      return "Sin conexión. Revisa tu internet.";
    default:
      return "No se pudo entrar. Intenta de nuevo.";
  }
}

// Login: el vendedor escribe solo su usuario; acá se le agrega @silvercow.app.
form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  // Acepta "dome", "Dome" o "dome@silvercow.app"; solo letras y números.
  const usuario = inUsuario.value.trim().toLowerCase().replace("@" + DOMINIO, "");
  const clave = inClave.value;
  err.hidden = true;
  if (!/^[a-z0-9]{1,12}$/.test(usuario) || !clave) {
    err.textContent = "Escribe tu usuario y tu contraseña.";
    err.hidden = false;
    return;
  }
  btnLogin.disabled = true;
  btnLogin.textContent = "Entrando...";
  try {
    await signInWithEmailAndPassword(auth, `${usuario}@${DOMINIO}`, clave);
    inClave.value = "";
  } catch (e) {
    console.error("vendedor/login", e.code);
    err.textContent = mensajeError(e.code);
    err.hidden = false;
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = "Entrar";
  }
});

$("btnLogout").addEventListener("click", () => signOut(auth));
$("btnLogoutRechazo").addEventListener("click", () => signOut(auth));

// Cada vez que cambia la sesión: sin usuario → login; sin rol activo → sin acceso;
// vendedor activo → se arma el panel con sus datos.
onAuthStateChanged(auth, async (u) => {
  if (!u) return mostrar($("pantallaLogin"));
  try {
    const rol = await getDoc(doc(db, "roles", u.uid));
    const r = rol.exists() ? rol.data() : null;
    if (!r || r.role !== "vendedor") {
      $("motivoRechazo").textContent = "Esta cuenta no es de vendedor (" + (u.email || "sin correo") + ").";
      return mostrar($("pantallaRechazo"));
    }
    if (r.activo !== true) {
      $("motivoRechazo").textContent = "Tu cuenta de vendedor está desactivada. Habla con el administrador.";
      return mostrar($("pantallaRechazo"));
    }
    const v = await getDoc(doc(db, "vendedores", r.sellerId));
    mostrar($("pantallaPanel"));
    iniciarPanel(r.sellerId, v.exists() ? v.data() : {});
  } catch (e) {
    console.error("vendedor/rol", e);
    $("motivoRechazo").textContent = "No se pudo comprobar tu acceso. Revisa tu conexión y vuelve a entrar.";
    mostrar($("pantallaRechazo"));
  }
});

// ── Panel ──
let cfg = armarConfig();

// Arma el panel: saludo, código, reglas del negocio, ventas y catálogo.
async function iniciarPanel(sellerId, vend) {
  $("saludo").textContent = "Hola, " + String(vend.nombre || sellerId).split(" ")[0];
  const codigo = vend.codigo || sellerId.toUpperCase();
  $("miCodigo").textContent = codigo;
  try {
    const c = await getDoc(doc(db, "config", "negocio"));
    if (c.exists()) cfg = armarConfig(c.data());
  } catch (e) { /* sin config: quedan los valores por defecto */ }
  $("textoCodigo").textContent =
    `Tus clientes lo escriben en el carrito de la página y reciben ${cfg.pctCodigo}% de descuento.`;
  $("btnCopiar").onclick = async () => {
    try {
      await navigator.clipboard.writeText(codigo);
      $("btnCopiar").textContent = "¡Copiado!";
    } catch { $("btnCopiar").textContent = "Mantén presionado para copiar"; }
    setTimeout(() => ($("btnCopiar").textContent = "Copiar"), 1800);
  };
  const mes = new Date().toLocaleDateString("es-EC", { month: "long" });
  $("nombreMes").textContent = mes;
  cargarVentas(sellerId);
  await cargarCatalogo();
  // El formulario de venta necesita el catálogo cargado (precios y estados).
  iniciarVenta({ sellerId, cfg, piezas, alGuardar: () => cargarVentas(sellerId) });
}

// Timestamp de Firestore → Date (o null si falta).
function fechaDe(x) {
  return x && typeof x.toDate === "function" ? x.toDate() : null;
}

// Trae SUS ventas en persona y SUS pedidos web (las reglas no dejan ver otros),
// los junta en una tabla y calcula la meta del mes.
async function cargarVentas(sellerId) {
  const estado = $("estadoVentas");
  try {
    const [ventas, pedidos] = await Promise.all([
      getDocs(query(collection(db, "ventas"), where("sellerId", "==", sellerId))),
      getDocs(query(collection(db, "pedidos_vendedor"), where("sellerId", "==", sellerId)))
    ]);
    const filas = [
      ...ventas.docs.map((d) => {
        const x = d.data();
        return { fecha: fechaDe(x.fecha), ref: x.descripcion || "Venta en persona", monto: x.precioFinal, estado: x.estado,
                 historial: (x.historial || []).map((h) => ({ estado: h.estado, fecha: fechaDe(h.fecha) })) };
      }),
      ...pedidos.docs.map((d) => {
        const x = d.data();
        return { fecha: fechaDe(x.fecha), ref: "Pedido web " + (x.codigo || d.id), monto: x.monto, estado: x.estado, historial: [] };
      })
    ].sort((a, b) => (b.fecha || 0) - (a.fecha || 0));

    // Meta: solo lo pagado de ESTE mes (cada mes empieza en cero).
    const mesActual = claveMes();
    const totalMes = filas
      .filter((f) => f.fecha && claveMes(f.fecha) === mesActual && ESTADOS_PAGADOS.includes(f.estado))
      .reduce((s, f) => s + (Number(f.monto) || 0), 0);
    pintarMeta(avanceMeta(totalMes, cfg));
    pintarComisionMes(sellerId, filas, mesActual);

    if (!filas.length) {
      estado.textContent = "Todavía no tienes ventas registradas. Cuando un cliente use tu código, aparecerá aquí.";
      return;
    }
    estado.hidden = true;
    $("ventasWrap").hidden = false;
    $("ventasCuerpo").innerHTML = filas.map((f) => {
      const pagada = ESTADOS_PAGADOS.includes(f.estado);
      const com = comision(f.monto, cfg);
      return `<tr>
        <td>${f.fecha ? f.fecha.toLocaleDateString("es-EC", { day: "2-digit", month: "short" }) : "—"}</td>
        <td>${escapar(f.ref)}</td>
        <td>${usd(f.monto)}</td>
        <td>${pagada ? usd(com) : `<span class="vend-pend">${usd(com)} (pendiente)</span>`}</td>
        <td>${escapar(ETIQUETA_ESTADO[f.estado] || f.estado || "—")}</td>
      </tr>`;
    }).join("");
  } catch (e) {
    console.error("vendedor/ventas", e);
    estado.textContent = "No se pudieron cargar tus ventas. Revisa tu conexión.";
    pintarMeta(avanceMeta(0, cfg));
  }
}

// Comisión del mes y si ya se pagó (Fase 6). El estado de pago viene del
// resumen que guarda el admin (`resumenes/`, solo el propio). Se consulta
// con where() porque leer directo un resumen que todavía no existe lo
// rechazan las reglas.
async function pintarComisionMes(sellerId, filas, mes) {
  const el = $("metaComision");
  try {
    const snap = await getDocs(query(collection(db, "resumenes"), where("sellerId", "==", sellerId)));
    const resumenes = snap.docs.map((d) => d.data());
    const pagados = new Set(resumenes.filter((r) => r.comisionPagada).map((r) => r.mes));
    const r = resumenMes(filas.map((f) => ({ ...f, historial: f.historial || [] })), mes, cfg, pagados);
    const guardado = resumenes.find((x) => x.mes === mes) || {};
    const pagado = Number(guardado.pagado) || 0;
    const falta = Math.max(0, Math.round((r.aPagar - pagado) * 100) / 100);
    el.innerHTML = `Comisión de este mes: <strong>${usd(r.aPagar)}</strong>` +
      (r.ajusteDevoluciones ? ` (−${usd(r.ajusteDevoluciones)} por devoluciones)` : "") +
      // Pagada si se cubrió todo, o si el admin la marcó pagada sin un pago parcial pendiente
      // (resúmenes viejos, de antes de guardar el monto pagado, no traen `pagado`).
      ((r.aPagar > 0 && falta <= 0) || (guardado.comisionPagada && !(pagado > 0 && falta > 0))
        ? ' · <span class="vend-pagada">pagada ✓</span>'
        : pagado > 0 ? ` · ya te pagaron ${usd(pagado)}, faltan ${usd(falta)}`
        : " · se paga a inicio del mes siguiente") +
      (r.bono ? `<br>Bono: ${guardado.bonoEntregado ? '<span class="vend-pagada">entregado ✓</span>' : "pendiente de entrega"}` : "");
    const anteriores = resumenes.filter((x) => x.mes < mes && x.aPagar > 0).sort((a, b) => b.mes.localeCompare(a.mes)).slice(0, 3);
    if (anteriores.length) el.innerHTML += "<br>" + anteriores.map((x) =>
      `${x.mes}: ${usd(x.aPagar)} ${x.comisionPagada ? '<span class="vend-pagada">pagada ✓</span>' : x.pagado ? `(pagado ${usd(x.pagado)})` : "pendiente"}`).join(" · ");
  } catch (e) {
    console.error("vendedor/comision", e);
    el.textContent = "";
  }
}

// Dibuja la barra de la meta y el texto del bono ganado / del próximo.
function pintarMeta(a) {
  $("metaTotal").textContent = usd(a.total);
  $("metaObjetivo").textContent = usd(a.meta);
  $("metaPct").textContent = a.pct + "%";
  $("metaRelleno").style.width = a.pct + "%";
  $("metaBarra").setAttribute("aria-valuenow", String(a.pct));
  const partes = [];
  if (a.alcanzado) partes.push(`Bono ganado este mes: ${a.alcanzado.texto}.`);
  if (a.proximo) partes.push(`Te faltan ${usd(a.faltaParaProximo)} para: ${a.proximo.texto}.`);
  $("metaBono").textContent = partes.join(" ");
}

// ── Catálogo y stock (solo lectura, paginado) ──
const POR_PAGINA = 20;
let piezas = [];
let visibles = POR_PAGINA;
const estadosActivos = new Set();
const ETQ = { disponible: "Disponible", pedido: "Bajo pedido", agotado: "Agotado" };

// Lee el catálogo público (el mismo de la página) para consulta y para el formulario de venta.
async function cargarCatalogo() {
  const est = $("estadoCat");
  try {
    for (let i = 0; i < 50 && typeof window.obtenerCatalogoFirestore !== "function"; i++) {
      await new Promise((r) => setTimeout(r, 100));
    }
    const cat = await window.obtenerCatalogoFirestore();
    piezas = Object.values(cat).flat().map((p) => {
      const m = String(p.desc || "").match(/\[([^\]]+)\]/);
      return { codigo: m ? m[1] : "", nombre: p.nombre, precio: p.precio, estado: p.estado };
    }).sort((a, b) => a.codigo.localeCompare(b.codigo));
    est.hidden = true;
    pintarCatalogo();
  } catch (e) {
    console.error("vendedor/catalogo", e);
    est.textContent = "No se pudo cargar el catálogo.";
  }
}

// Aplica buscador + filtros de estado sobre el catálogo ya cargado.
function filtradas() {
  const t = normalizar($("buscadorCat").value.trim());
  return piezas.filter((p) =>
    (!t || normalizar(p.nombre).includes(t) || normalizar(p.codigo).includes(t)) &&
    (estadosActivos.size === 0 || estadosActivos.has(p.estado)));
}

// Pinta las piezas de a POR_PAGINA ("Ver más" suma otra página).
function pintarCatalogo() {
  const lista = filtradas();
  const est = $("estadoCat");
  if (!lista.length) {
    est.hidden = false;
    est.textContent = "No hay piezas con ese filtro.";
  } else est.hidden = true;
  $("listaCat").innerHTML = lista.slice(0, visibles).map((p) => `
    <div class="vend-pieza">
      <span class="vend-pieza-cod">${escapar(p.codigo)}</span>
      <span class="vend-pieza-nom">${escapar(p.nombre)}</span>
      <span class="vend-pieza-precio">${usd(p.precio)}</span>
      <span class="vend-estado vend-estado-${escapar(p.estado)}">${escapar(ETQ[p.estado] || p.estado)}</span>
    </div>`).join("");
  $("btnMasCat").hidden = lista.length <= visibles;
}

$("buscadorCat").addEventListener("input", () => { visibles = POR_PAGINA; pintarCatalogo(); });
$("btnMasCat").addEventListener("click", () => { visibles += POR_PAGINA; pintarCatalogo(); });
document.querySelectorAll("#filtrosCat .admin-filtro").forEach((b) => {
  b.addEventListener("click", () => {
    const e = b.dataset.estado;
    estadosActivos.has(e) ? estadosActivos.delete(e) : estadosActivos.add(e);
    b.classList.toggle("activo", estadosActivos.has(e));
    b.setAttribute("aria-pressed", estadosActivos.has(e) ? "true" : "false");
    visibles = POR_PAGINA;
    pintarCatalogo();
  });
});
