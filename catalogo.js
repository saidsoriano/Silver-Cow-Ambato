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
  const primerBtn = document.querySelector('.cat-btn');
  if (primerBtn && typeof cargarCategoria === 'function') {
    cargarCategoria('pulseras', primerBtn);
  } else {
    console.error('No se encontró el botón de categoría o la función cargarCategoria');
  }
}

mostrarCargando();

fetch(SHEETS_URL)
  .then(r => {
    if (!r.ok) throw new Error('Error HTTP: ' + r.status);
    return r.json();
  })
  .then(datos => {
    console.log('Catálogo cargado:', Object.keys(datos).length, 'categorías');
    CATALOGO = datos;
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      iniciarCatalogo();
    } else {
      document.addEventListener('DOMContentLoaded', iniciarCatalogo);
    }
  })
  .catch(err => {
    console.error('Error cargando catálogo:', err);
    const contenedor = document.getElementById('catalogoContenedor');
    if (contenedor) {
      contenedor.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#ff6b6b;font-size:18px;">Error al cargar el catálogo. Por favor recarga la página.</div>';
    }
  });
