// ══════════════════════════════════════════════════
// CATÁLOGO DE PRODUCTOS — Silver Cow Ambato
// Los datos se cargan desde Google Sheets con caché local
// ══════════════════════════════════════════════════

const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwN-2Ee7YTiKae_PIr2SjMETDqL6y-u-Hi135y0xc9v1i2gk1SUNijUUR7OUJi4u48d/exec?v=1';
const CACHE_KEY = 'silvercow_catalogo';

let CATALOGO = {};

function mostrarCargando() {
  const contenedor = document.getElementById('catalogoContenedor');
  if (contenedor) {
    contenedor.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#999;font-size:18px;">Cargando catálogo...</div>';
  }
}

function mostrarActualizando() {
  const contenedor = document.getElementById('catalogoContenedor');
  if (contenedor && !contenedor.querySelector('.actualizando-indicator')) {
    const indicator = document.createElement('div');
    indicator.className = 'actualizando-indicator';
    indicator.style.cssText = 'text-align:center;padding:8px;color:#666;font-size:13px;opacity:0.7;';
    indicator.textContent = 'Actualizando...';
    contenedor.insertBefore(indicator, contenedor.firstChild);
  }
}

function ocultarActualizando() {
  const indicator = document.querySelector('.actualizando-indicator');
  if (indicator) indicator.remove();
}

function iniciarCatalogo() {
  if (typeof cargarCategoria !== 'function') {
    setTimeout(iniciarCatalogo, 100);
    return;
  }
  
  const primerBtn = document.querySelector('.cat-btn');
  if (primerBtn) {
    cargarCategoria('pulseras', primerBtn);
  }
}

function cargarDesdeCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      CATALOGO = JSON.parse(cached);
      console.log('Catálogo cargado desde caché local');
      return true;
    }
  } catch (e) {
    console.warn('Error leyendo caché:', e);
  }
  return false;
}

function guardarEnCache(datos) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(datos));
  } catch (e) {
    console.warn('Error guardando caché:', e);
  }
}

function datosSonIguales(datos1, datos2) {
  return JSON.stringify(datos1) === JSON.stringify(datos2);
}

function actualizarCatalogo(datos) {
  const esActualizacion = Object.keys(CATALOGO).length > 0;
  
  if (esActualizacion && datosSonIguales(CATALOGO, datos)) {
    console.log('Datos sin cambios, no se actualiza');
    ocultarActualizando();
    return;
  }
  
  CATALOGO = datos;
  guardarEnCache(datos);
  
  if (esActualizacion) {
    console.log('Catálogo actualizado en segundo plano');
    ocultarActualizando();
    iniciarCatalogo();
  } else {
    console.log('Catálogo cargado por primera vez');
    iniciarCatalogo();
  }
}

// Intentar cargar desde caché primero (instantáneo)
const hayCache = cargarDesdeCache();

if (hayCache) {
  console.log('Mostrando datos cacheados inmediatamente');
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    iniciarCatalogo();
  } else {
    document.addEventListener('DOMContentLoaded', iniciarCatalogo);
  }
  
  mostrarActualizando();
} else {
  console.log('No hay caché, mostrando indicador de carga');
  mostrarCargando();
}

// Siempre actualizar en segundo plano
console.log('Iniciando fetch a Google Sheets...');

fetch(SHEETS_URL)
  .then(r => {
    if (!r.ok) throw new Error('Error HTTP: ' + r.status);
    return r.json();
  })
  .then(datos => {
    console.log('Datos frescos recibidos:', Object.keys(datos).length, 'categorías');
    actualizarCatalogo(datos);
  })
  .catch(err => {
    console.error('Error actualizando catálogo:', err);
    ocultarActualizando();
    
    if (!hayCache) {
      const contenedor = document.getElementById('catalogoContenedor');
      if (contenedor) {
        contenedor.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#ff6b6b;font-size:18px;">Error al cargar el catálogo. Por favor recarga la página.</div>';
      }
    }
  });
