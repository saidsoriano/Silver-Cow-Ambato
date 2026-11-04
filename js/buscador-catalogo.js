// ══════════════════════════════════════════════════
// BUSCADOR DEL CATÁLOGO PÚBLICO — Silver Cow Ambato
// Busca en TODAS las categorías a la vez (no solo la que está activa en
// los tiles), por nombre, código y descripción. Mientras hay texto,
// reemplaza el contenido de #catalogoContenedor por los resultados; al
// borrar el texto, vuelve a mostrar la categoría que estaba activa.
//
// Feature 011-arreglos-pagina, ítem 8 — ver spec/features/011-arreglos-pagina/.
// ══════════════════════════════════════════════════

(function () {
  'use strict';

  var MIN_CARACTERES = 2; // con menos, el resultado sería "todo el catálogo"

  var input, contenedor;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    input = document.getElementById('buscadorCatalogo');
    contenedor = document.getElementById('catalogoContenedor');
    if (!input || !contenedor) return;

    input.addEventListener('input', function () { onBuscar(input.value); });

    // Un clic en un tile de categoría vuelve a la navegación normal:
    // limpia cualquier búsqueda en curso (cargarCategoria ya reconstruye
    // #catalogoContenedor por su cuenta).
    document.querySelectorAll('.catalogo-bento .cat-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { input.value = ''; });
    });
  }

  function normalizar(s) {
    // Mismo criterio que el buscador del panel admin (js/admin/productos.js):
    // NFD separa acentos de la letra, y el replace los saca, para que
    // "anillo" encuentre también "Anillo Corazón".
    return String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function onBuscar(textoCrudo) {
    var texto = normalizar(textoCrudo.trim());

    if (texto.length < MIN_CARACTERES) {
      restaurarCategoriaActiva();
      return;
    }
    if (typeof CATALOGO === 'undefined' || !CATALOGO || typeof crearTarjeta !== 'function') return;

    var resultados = buscar(texto);
    pintarResultados(resultados, textoCrudo.trim());
  }

  function buscar(texto) {
    var out = [];
    Object.keys(CATALOGO).forEach(function (cat) {
      (CATALOGO[cat] || []).forEach(function (p) {
        var nombre = normalizar(p.nombre);
        var desc = normalizar(p.desc); // la descripción ya trae el código entre corchetes
        if (nombre.indexOf(texto) !== -1 || desc.indexOf(texto) !== -1) out.push(p);
      });
    });
    // Mismo orden que cada categoría: disponibles primero, agotados al final
    var peso = { disponible: 0, pedido: 1, agotado: 2 };
    out.sort(function (a, b) { return (peso[a.estado] ?? 1) - (peso[b.estado] ?? 1); });
    return out;
  }

  function pintarResultados(productos, textoMostrado) {
    contenedor.innerHTML = '';

    var seccion = document.createElement('div');
    seccion.className = 'cat-section visible';

    var cuenta = productos.length
      ? productos.length + (productos.length === 1 ? ' resultado' : ' resultados')
      : 'Sin resultados';

    seccion.innerHTML =
      '<div class="cat-title-row">' +
        '<h3 class="cat-title">Buscando: ' + escaparTexto(textoMostrado) + '</h3>' +
        '<div class="cat-title-line"></div>' +
        '<span class="cat-count">' + cuenta + '</span>' +
      '</div>' +
      '<div class="joyas-grid"></div>';

    contenedor.appendChild(seccion);

    var grid = seccion.querySelector('.joyas-grid');
    if (!productos.length) {
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px 0;">' +
        'No encontramos piezas para "' + escaparTexto(textoMostrado) + '". Probá con otro nombre o código.</p>';
      return;
    }
    productos.forEach(function (p) { grid.appendChild(crearTarjeta(p)); });
  }

  function restaurarCategoriaActiva() {
    var btnActivo = document.querySelector('.catalogo-bento .cat-btn.active');
    if (!btnActivo) return;
    var m = (btnActivo.getAttribute('onclick') || '').match(/cargarCategoria\('([^']+)'/);
    if (!m || typeof cargarCategoria !== 'function') return;
    // Evita recargar si ya se está mostrando esa categoría (ej. al borrar
    // la búsqueda letra por letra sin haber llegado al mínimo).
    if (contenedor.querySelector('#seccion-' + m[1])) return;
    cargarCategoria(m[1], btnActivo, false);
  }

  function escaparTexto(s) {
    return String(s ?? '').replace(/[&<>]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
    });
  }
})();
