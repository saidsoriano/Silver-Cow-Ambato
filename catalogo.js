// ══════════════════════════════════════════════════
// CATÁLOGO DE PRODUCTOS — Silver Cow Ambato
// Los datos se cargan desde Google Sheets
// ══════════════════════════════════════════════════

// URL del Google Apps Script — CAMBIA ESTA URL cuando publiques tu script
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbw3uqoeT2pbxSLmruMfz4UHolA5LabcDR2pJ3XjNPgXijcKJ9QyGisyHux1jeBaVbaA/exec';

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
