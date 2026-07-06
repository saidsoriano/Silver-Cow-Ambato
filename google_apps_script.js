// ══════════════════════════════════════════════════
// GOOGLE APPS SCRIPT — Silver Cow Ambato
// Este código va en Extensiones → Apps Script de tu hoja
// ══════════════════════════════════════════════════

function doGet() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const productos = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j].trim().toLowerCase();
      let val = row[j];

      if (key === 'precio') val = Number(val) || 0;
      if (key === 'espedido') val = val === true || val === 'true' || val === 'TRUE' || val === 'si' || val === 'SI';
      if (key === 'estado') val = String(val).trim().toLowerCase();

      obj[key] = val;
    }

    // Renombrar 'espedido' a 'esPedido' para compatibilidad
    obj.esPedido = obj.espedido;
    delete obj.espedido;

    // Reconstruir desc con código
    const codigo = obj.codigo ? obj.codigo + ' ' : '';
    obj.desc = codigo + (obj.desc || '');

    productos.push(obj);
  }

  // Agrupar por categoría
  const catalogo = {};
  productos.forEach(p => {
    const cat = p.categoria;
    if (!catalogo[cat]) catalogo[cat] = [];
    catalogo[cat].push({
      estado: p.estado,
      img: p.img,
      nombre: p.nombre,
      desc: p.desc,
      precio: p.precio,
      esPedido: p.esPedido
    });
  });

  const output = JSON.stringify(catalogo);
  return ContentService
    .createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}
