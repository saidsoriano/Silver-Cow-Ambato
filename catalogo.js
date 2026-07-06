// ══════════════════════════════════════════════════
// CATÁLOGO DE PRODUCTOS — Silver Cow Ambato
// Los datos se cargan desde Google Sheets
// ══════════════════════════════════════════════════

const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwN-2Ee7YTiKae_PIr2SjMETDqL6y-u-Hi135y0xc9v1i2gk1SUNijUUR7OUJi4u48d/exec?_=' + Date.now();

let CATALOGO = {};

function mostrarCargando() {
  const contenedor = document.getElementById('catalogoContenedor');
  if (contenedor) {
    contenedor.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#999;font-size:18px;">Cargando catálogo...</div>';
  }
}

function iniciarCatalogo() {
  // Verificar que cargarCategoria esté definida
  if (typeof cargarCategoria !== 'function') {
    console.log('Esperando a que catalogo_motor.js cargue...');
    setTimeout(iniciarCatalogo, 100);
    return;
  }
  
  const primerBtn = document.querySelector('.cat-btn');
  if (primerBtn) {
    console.log('Iniciando catálogo con categoría: pulseras');
    cargarCategoria('pulseras', primerBtn);
  } else {
    console.error('No se encontró el botón de categoría');
  }
}

mostrarCargando();

console.log('catalogo.js: Iniciando fetch a Google Sheets...');
console.log('catalogo.js: URL:', SHEETS_URL);

fetch(SHEETS_URL)
  .then(r => {
    console.log('catalogo.js: Respuesta recibida, status:', r.status);
    if (!r.ok) throw new Error('Error HTTP: ' + r.status);
    return r.json();
  })
  .then(datos => {
    const numCats = Object.keys(datos).length;
    console.log('catalogo.js: Catálogo cargado:', numCats, 'categorías');
    console.log('catalogo.js: Categorías:', Object.keys(datos));
    CATALOGO = datos;
    console.log('catalogo.js: CATALOGO asignado, llamando a iniciarCatalogo...');
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      iniciarCatalogo();
    } else {
      console.log('catalogo.js: DOM no listo, esperando DOMContentLoaded...');
      document.addEventListener('DOMContentLoaded', iniciarCatalogo);
    }
  })
  .catch(err => {
    console.error('catalogo.js: Error cargando catálogo:', err);
    const contenedor = document.getElementById('catalogoContenedor');
    if (contenedor) {
      contenedor.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#ff6b6b;font-size:18px;">Error al cargar el catálogo. Por favor recarga la página.</div>';
    }
  });
