// ══════════════════════════════════════════════════
// CATÁLOGO DE PRODUCTOS — Silver Cow Ambato
// Los datos se cargan desde Google Sheets
// ══════════════════════════════════════════════════

// URL del Google Apps Script — CAMBIA ESTA URL cuando publiques tu script
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwN-2Ee7YTiKae_PIr2SjMETDqL6y-u-Hi135y0xc9v1i2gk1SUNijUUR7OUJi4u48d/exec' + '?_=' + Date.now();

let CATALOGO = {};

function iniciarCatalogo() {
  const primerBtn = document.querySelector('.cat-btn');
  if (primerBtn && typeof cargarCategoria === 'function') {
    cargarCategoria('pulseras', primerBtn);
  }
}

fetch(SHEETS_URL)
  .then(r => r.json())
  .then(datos => {
    CATALOGO = datos;
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      iniciarCatalogo();
    } else {
      document.addEventListener('DOMContentLoaded', iniciarCatalogo);
    }
  })
  .catch(err => {
    console.error('Error cargando catálogo desde Google Sheets:', err);
  });
