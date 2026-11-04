// ══════════════════════════════════════════════════
// CATÁLOGO DE PRODUCTOS — Silver Cow Ambato
// Los datos se cargan desde Firestore (antes: Google Sheets), con la
// misma caché local de siempre. Google Sheets quedó congelado desde la
// sesión 017 — ver spec/features/010-vista-admin/spec.md.
// ══════════════════════════════════════════════════

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

// Siempre actualizar en segundo plano, desde Firestore.
// js/firestore-catalogo.js es un módulo ES (carga diferida por naturaleza);
// este script es clásico y corre de inmediato, así que puede llegar a este
// punto antes de que el módulo haya terminado de cargar. Se espera a que
// aparezca `window.obtenerCatalogoFirestore`, mismo patrón que ya usa
// iniciarCatalogo() más arriba en este archivo.
function cargarDesdeFirestore(intentos) {
  if (typeof window.obtenerCatalogoFirestore !== 'function') {
    if (intentos > 100) { // ~10s de margen — de sobra para un módulo chico
      console.error('catalogo.js: firestore-catalogo.js no cargó a tiempo');
      ocultarActualizando();
      return;
    }
    setTimeout(() => cargarDesdeFirestore((intentos || 0) + 1), 100);
    return;
  }

  console.log('Iniciando consulta a Firestore...');
  window.obtenerCatalogoFirestore()
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
}
cargarDesdeFirestore(0);
