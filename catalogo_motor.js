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
  console.log('catalogo_motor.js: cargarCategoria llamada con:', cat);
  
  // Actualiza botón activo
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btnEl.classList.add('active');

  // Actualiza estado
  categoriaActiva   = cat;
  productosMostrados = 0;

  // Limpia el contenedor
  const contenedor = document.getElementById('catalogoContenedor');
  console.log('catalogo_motor.js: contenedor encontrado:', !!contenedor);
  contenedor.innerHTML = '';

  // Verificar que CATALOGO tenga la categoría
  if (!CATALOGO[cat]) {
    console.error('catalogo_motor.js: CATEGORÍA NO ENCONTRADA:', cat);
    console.log('catalogo_motor.js: Categorías disponibles:', Object.keys(CATALOGO));
    contenedor.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#ff6b6b;">Error: Categoría no encontrada</div>';
    return;
  }

  // Ordena: disponibles primero, pedido segundo, agotados al final
  const peso = { disponible: 0, pedido: 1, agotado: 2 };
  const productos = [...CATALOGO[cat]].sort((a, b) =>
    (peso[a.estado] ?? 1) - (peso[b.estado] ?? 1)
  );
  
  console.log('catalogo_motor.js:', productos.length, 'productos en', cat);

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

  // Extrae el código del producto desde la descripción — ej: [P-AN-252]
  const codigoMatch = p.desc ? p.desc.match(/\[[^\]]+\]/) : null;
  const codigo      = codigoMatch ? codigoMatch[0] : '';

  // Descripción sin el código al inicio (para mostrarlo limpio en la tarjeta)
  const descLimpia = p.desc ? p.desc.replace(/^\[[^\]]+\]\s*/, '') : '';

  // Badge según estado
  const badgeClass = p.estado === 'disponible' ? 'badge-disponible' :
                     p.estado === 'agotado'    ? 'badge-agotado'    : 'badge-pedido';
  const badgeText  = p.estado === 'disponible' ? 'Disponible' :
                     p.estado === 'agotado'    ? 'Agotado'    : 'Bajo Pedido';

  // Nombre seguro para usar dentro de onclick (escapa comillas)
  const nombreSeguro = p.nombre.replace(/'/g, "\\'").replace(/"/g, '&quot;');
  const codigoSeguro = codigo.replace(/'/g, "\\'");

  // Footer según estado — pasa el código al carrito como 4to parámetro
  let footer = '';
  if (p.estado === 'agotado') {
    footer = `
      <span class="joya-precio tachado">$${p.precio.toFixed(2)}</span>
      <button class="joya-btn" disabled>Agotado</button>`;
  } else if (p.esPedido) {
    footer = `
      <span class="joya-precio">$${p.precio.toFixed(2)}</span>
      <button class="joya-btn btn-consulta" onclick="agregarAlCarrito('${nombreSeguro}', ${p.precio}, true, '${codigoSeguro}')">Agregar</button>`;
  } else {
    footer = `
      <span class="joya-precio">$${p.precio.toFixed(2)}</span>
      <button class="joya-btn" onclick="agregarAlCarrito('${nombreSeguro}', ${p.precio}, false, '${codigoSeguro}')">Agregar</button>`;
  }

  // Descripción limpia sin el código
  const descHTML = descLimpia ? `<p class="joya-desc">${descLimpia}</p>` : '';

  // Código visible en la tarjeta (pequeño y discreto)
  const codigoHTML = codigo ? `<div class="joya-codigo">${codigo}</div>` : '';

  // loading="lazy" — la imagen NO se descarga hasta que sea visible
  div.innerHTML = `
    <div class="joya-img-wrap">
      <img src="${p.img}" alt="${p.nombre}" loading="lazy"
           onerror="this.parentElement.style.background='rgba(15,37,87,0.3)'">
      <span class="joya-badge ${badgeClass}">${badgeText}</span>
      <div class="sello-agotado">Agotado</div>
      <div class="zoom-lens"></div>
    </div>
    <div class="joya-info">
      <div class="joya-material">${CONFIG.PLATA_LEY}</div>
      <h4 class="joya-nombre">${p.nombre}</h4>
      ${codigoHTML}
      ${descHTML}
      <div class="joya-footer">${footer}</div>
    </div>`;

  // Activa el zoom Amazon solo en desktop
  activarZoom(div);

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


// ── ZOOM TIPO AMAZON ──
// Al pasar el mouse por la imagen, aparece un panel ampliado al lado
// Solo funciona en desktop (pointer: fine = mouse real)
function activarZoom(card) {
  // Solo en desktop con mouse real — no en táctil
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const wrap = card.querySelector('.joya-img-wrap');
  const img  = card.querySelector('img');
  const lens = card.querySelector('.zoom-lens');

  // Crea el panel de zoom y lo agrega al BODY para que nunca quede cortado
  const panel = document.createElement('div');
  panel.className = 'zoom-panel';
  panel.style.display = 'none';
  document.body.appendChild(panel);

  wrap.addEventListener('mouseenter', () => {
    if (!img.complete || img.naturalWidth === 0) return;
    lens.style.display  = 'block';
    panel.style.display = 'block';
    panel.style.backgroundImage = `url(${img.src})`;
  });

  wrap.addEventListener('mouseleave', () => {
    lens.style.display  = 'none';
    panel.style.display = 'none';
  });

  wrap.addEventListener('mousemove', (e) => {
    if (!img.complete || img.naturalWidth === 0) return;

    const rect   = wrap.getBoundingClientRect();
    const lensW  = 80;
    const lensH  = 80;
    const panelW = 300;
    const panelH = 300;

    // Posición del mouse dentro de la imagen
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    // Centra la lupa en el cursor — limitada dentro de la imagen
    let lx = Math.max(0, Math.min(x - lensW / 2, rect.width  - lensW));
    let ly = Math.max(0, Math.min(y - lensH / 2, rect.height - lensH));

    // Posiciona la lupa dentro de la imagen
    lens.style.left = `${lx}px`;
    lens.style.top  = `${ly}px`;

    // Posiciona el panel en posición fija — a la derecha de la tarjeta
    let panelX = rect.right + 12;    // 12px a la derecha del borde de la imagen
    let panelY = rect.top;           // Alineado con el tope de la imagen

    // Si no cabe a la derecha, lo pone a la izquierda
    if (panelX + panelW > window.innerWidth - 12) {
      panelX = rect.left - panelW - 12;
    }

    // Si se sale por abajo, lo sube
    if (panelY + panelH > window.innerHeight - 12) {
      panelY = window.innerHeight - panelH - 12;
    }

    panel.style.position = 'fixed';
    panel.style.left     = `${panelX}px`;
    panel.style.top      = `${panelY}px`;
    panel.style.width    = `${panelW}px`;
    panel.style.height   = `${panelH}px`;

    // Factor de ampliación y posición del fondo
    const zoomX = panelW / lensW;
    const zoomY = panelH / lensH;
    panel.style.backgroundSize     = `${rect.width * zoomX}px ${rect.height * zoomY}px`;
    panel.style.backgroundPosition = `-${lx * zoomX}px -${ly * zoomY}px`;
  });
}


// ── INICIALIZACIÓN ──
// La primera categoría se carga desde catalogo.js después del fetch