// ══════════════════════════════════════════════════
// MOTOR DINÁMICO DEL CATÁLOGO — Silver Cow Ambato
// Este archivo maneja toda la lógica de renderizado,
// paginación y lazy loading del catálogo
// ══════════════════════════════════════════════════

// Cuántos productos se muestran por bloque (inicial y en cada "Ver más")
const LIMITE = 5;

// Estado actual del catálogo
let categoriaActiva  = 'pulseras'; // Categoría que se está mostrando
let productosMostrados = 0;        // Cuántos productos están en el DOM ahora

// ── CARGAR CATEGORÍA ──
// Se llama al hacer clic en un botón de filtro
// cat: nombre de la categoría | btnEl: el botón que se hizo clic
function cargarCategoria(cat, btnEl) {
  // Actualiza botón activo
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btnEl.classList.add('active');

  // Actualiza estado
  categoriaActiva   = cat;
  productosMostrados = 0;

  // Limpia el contenedor
  const contenedor = document.getElementById('catalogoContenedor');
  contenedor.innerHTML = '';

  // Ordena: disponibles primero, pedido segundo, agotados al final
  const peso = { disponible: 0, pedido: 1, agotado: 2 };
  const productos = [...CATALOGO[cat]].sort((a, b) =>
    (peso[a.estado] ?? 1) - (peso[b.estado] ?? 1)
  );

  // Crea la sección con título y contador
  const seccion = document.createElement('div');
  seccion.className = 'cat-section visible'; // visible directo, ya está en pantalla
  seccion.id = `seccion-${cat}`;
  seccion.dataset.productos = JSON.stringify(productos); // Guarda todos los productos
  seccion.dataset.mostrados = '0';

  const disponibles = productos.filter(p => p.estado === 'disponible').length;
  const labels = {
    pulseras: 'Pulseras', anillos: 'Anillos', aretes: 'Aretes',
    juegos: 'Juegos', dijes: 'Dijes', cadenas: 'Cadenas', cadenas_dijes: 'Cadenas con Dijes'
  };

  seccion.innerHTML = `
    <div class="cat-title-row">
      <h3 class="cat-title">${labels[cat] || cat}</h3>
      <div class="cat-title-line"></div>
      <span class="cat-count">${disponibles} disponible${disponibles !== 1 ? 's' : ''} · ${productos.length} pieza${productos.length !== 1 ? 's' : ''}</span>
    </div>
    <div class="joyas-grid" id="grid-${cat}"></div>
    <div class="ver-mas-wrap" id="vermas-${cat}"></div>
  `;

  contenedor.appendChild(seccion);

  // Renderiza los primeros LIMITE productos
  renderizarMas(cat, productos);
}


// ── RENDERIZAR MÁS PRODUCTOS ──
// Agrega LIMITE productos más al grid de la categoría
function renderizarMas(cat, productosParam) {
  const seccion   = document.getElementById(`seccion-${cat}`);
  const grid      = document.getElementById(`grid-${cat}`);
  const vermasDiv = document.getElementById(`vermas-${cat}`);

  // Usa los productos pasados o los del dataset
  const productos = productosParam || JSON.parse(seccion.dataset.productos);
  const desde     = parseInt(seccion.dataset.mostrados) || 0;
  const hasta     = Math.min(desde + LIMITE, productos.length);

  // Renderiza los productos del rango [desde, hasta)
  for (let i = desde; i < hasta; i++) {
    const p = productos[i];
    grid.appendChild(crearTarjeta(p));
  }

  // Actualiza cuántos llevamos mostrados
  seccion.dataset.mostrados = hasta;

  // Actualiza el botón ver más / ver menos
  actualizarBotonesVerMas(cat, productos, hasta);
}


// ── CREAR TARJETA DE JOYA ──
// Recibe un objeto producto y devuelve un elemento DOM
function crearTarjeta(p) {
  const div = document.createElement('div');
  div.className = `joya-card${p.estado === 'agotado' ? ' agotado' : ''}`;
  div.dataset.estado = p.estado;

  // Badge según estado
  const badgeClass = p.estado === 'disponible' ? 'badge-disponible' :
                     p.estado === 'agotado'    ? 'badge-agotado'    : 'badge-pedido';
  const badgeText  = p.estado === 'disponible' ? 'Disponible' :
                     p.estado === 'agotado'    ? 'Agotado'    : 'Bajo Pedido';

  // Footer según estado
  let footer = '';
  if (p.estado === 'agotado') {
    footer = `
      <span class="joya-precio tachado">$${p.precio.toFixed(2)}</span>
      <button class="joya-btn" disabled>Agotado</button>`;
  } else if (p.esPedido) {
    footer = `
      <span class="joya-precio-consulta">Bajo Pedido</span>
      <button class="joya-btn btn-consulta" onclick="agregarAlCarrito('${p.nombre.replace(/'/g,"\\'")}', ${p.precio}, true)">Agregar</button>`;
  } else {
    footer = `
      <span class="joya-precio">$${p.precio.toFixed(2)}</span>
      <button class="joya-btn" onclick="agregarAlCarrito('${p.nombre.replace(/'/g,"\\'")}', ${p.precio}, false)">Agregar</button>`;
  }

  // Descripción opcional
  const desc = p.desc ? `<p class="joya-desc">${p.desc}</p>` : '';

  // loading="lazy" es clave — la imagen NO se descarga hasta que sea visible
  div.innerHTML = `
    <div class="joya-img-wrap">
      <img src="${p.img}" alt="${p.nombre}" loading="lazy"
           onerror="this.parentElement.style.background='rgba(15,37,87,0.3)'">
      <span class="joya-badge ${badgeClass}">${badgeText}</span>
      <div class="sello-agotado">Agotado</div>
    </div>
    <div class="joya-info">
      <div class="joya-material">Plata Ley 925</div>
      <h4 class="joya-nombre">${p.nombre}</h4>
      ${desc}
      <div class="joya-footer">${footer}</div>
    </div>`;

  return div;
}


// ── ACTUALIZAR BOTONES VER MÁS / VER MENOS ──
function actualizarBotonesVerMas(cat, productos, mostrados) {
  const vermasDiv = document.getElementById(`vermas-${cat}`);
  vermasDiv.innerHTML = ''; // Limpia los botones anteriores

  const hayMas   = mostrados < productos.length;
  const hayMenos = mostrados > LIMITE;

  // Botón VER MÁS — aparece si quedan productos por mostrar
  if (hayMas) {
    const btnMas = document.createElement('button');
    btnMas.className = 'btn-ver-mas';
    const restantes = Math.min(LIMITE, productos.length - mostrados);
    btnMas.innerHTML = `
      Ver ${restantes} más
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 5v14M5 12l7 7 7-7"/>
      </svg>`;
    btnMas.onclick = () => renderizarMas(cat);
    vermasDiv.appendChild(btnMas);
  }

  // Botón VER MENOS — aparece si se muestran más de LIMITE
  if (hayMenos) {
    const btnMenos = document.createElement('button');
    btnMenos.className = 'btn-ver-mas';
    btnMenos.style.marginLeft = hayMas ? '12px' : '0';
    btnMenos.innerHTML = `
      Ver menos
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 19V5M5 12l7-7 7 7"/>
      </svg>`;
    btnMenos.onclick = () => quitarCinco(cat, productos);
    vermasDiv.appendChild(btnMenos);
  }
}


// ── QUITAR CINCO PRODUCTOS ──
// Elimina los últimos 5 del DOM (ver menos)
function quitarCinco(cat, productos) {
  const seccion  = document.getElementById(`seccion-${cat}`);
  const grid     = document.getElementById(`grid-${cat}`);
  const mostrados = parseInt(seccion.dataset.mostrados);

  const nuevoTotal = Math.max(LIMITE, mostrados - LIMITE);
  const quitar     = mostrados - nuevoTotal;

  // Elimina los últimos N tarjetas del grid
  const tarjetas = grid.querySelectorAll('.joya-card');
  for (let i = tarjetas.length - 1; i >= tarjetas.length - quitar; i--) {
    tarjetas[i].remove();
  }

  seccion.dataset.mostrados = nuevoTotal;
  actualizarBotonesVerMas(cat, productos, nuevoTotal);

  // Scroll suave al inicio de la sección si se contrajo mucho
  if (nuevoTotal === LIMITE) {
    seccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}


// ── INICIALIZACIÓN ──
// Carga la primera categoría al abrir la página
document.addEventListener('DOMContentLoaded', () => {
  const primerBtn = document.querySelector('.cat-btn');
  if (primerBtn) cargarCategoria('pulseras', primerBtn);
});
