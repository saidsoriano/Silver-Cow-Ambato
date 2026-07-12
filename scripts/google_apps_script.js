// ══════════════════════════════════════════════════
// GOOGLE APPS SCRIPT — Silver Cow Ambato
// Este código va en Extensiones → Apps Script de tu hoja
// ══════════════════════════════════════════════════

function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const catalogo = {};

  sheets.forEach(sheet => {
    const name = sheet.getName();
    if (name === 'Config' || name === 'Resumen') return;

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return;

    const headers = data[0];
    const productos = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) continue; // Saltar filas vacías

      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        const key = headers[j].trim().toLowerCase();
        let val = row[j];

        if (key === 'precio') val = Number(val) || 0;
        if (key === 'espedido') val = val === true || val === 'true' || val === 'TRUE' || val === 'si' || val === 'SI';
        if (key === 'estado') val = String(val).trim().toLowerCase();

        obj[key] = val;
      }

      obj.esPedido = obj.espedido;
      delete obj.espedido;

      const codigo = obj.codigo ? obj.codigo + ' ' : '';
      obj.desc = codigo + (obj.desc || '');

      productos.push(obj);
    }

    if (productos.length > 0) {
      catalogo[name] = productos;
    }
  });

  const output = JSON.stringify(catalogo);
  return ContentService
    .createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}

// ══════════════════════════════════════════════════
// CONFIGURAR HOJAS — Ejecutar UNA VEZ
// Crea una hoja por categoría con formato y filtros
// ══════════════════════════════════════════════════
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const categorias = ['pulseras', 'anillos', 'aretes', 'juegos', 'dijes', 'cadenas', 'cadenas_dijes'];
  const headers = ['nombre', 'precio', 'codigo', 'estado', 'esPedido', 'img', 'desc'];

  // Colores para cada categoría
  const colores = {
    pulseras: '#E8F5E9',
    anillos: '#FFF3E0',
    aretes: '#E3F2FD',
    juegos: '#F3E5F5',
    dijes: '#FFF9C4',
    cadenas: '#FCE4EC',
    cadenas_dijes: '#E0F2F1'
  };

  categorias.forEach(cat => {
    let sheet = ss.getSheetByName(cat);
    if (!sheet) {
      sheet = ss.insertSheet(cat);
      // Solo poner headers si la hoja es nueva
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#0F2557')
        .setFontColor('#FFFFFF')
        .setFontWeight('bold')
        .setHorizontalAlignment('center');
    }

    // Ancho de columnas
    sheet.setColumnWidth(1, 200); // nombre
    sheet.setColumnWidth(2, 80);  // precio
    sheet.setColumnWidth(3, 120); // codigo
    sheet.setColumnWidth(4, 100); // estado
    sheet.setColumnWidth(5, 80);  // esPedido
    sheet.setColumnWidth(6, 200); // img
    sheet.setColumnWidth(7, 300); // desc

    // Color de fondo para la hoja
    const lastRow = sheet.getLastRow() + 100;
    sheet.getRange(2, 1, lastRow, headers.length).setBackground(colores[cat]);

    // Filtros
    const estadoRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['disponible', 'agotado', 'pedido'], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange('D2:D' + lastRow).setDataValidation(estadoRule);

    const pedidoRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['TRUE', 'FALSE'], true)
      .setAllowInvalid(false)
      .build();
    sheet.getRange('E2:E' + lastRow).setDataValidation(pedidoRule);

    // Congelar primera fila
    sheet.setFrozenRows(1);
  });

  // Eliminar hoja por defecto si existe
  const defaultSheet = ss.getSheetByName('Hoja 1');
  if (defaultSheet) {
    ss.deleteSheet(defaultSheet);
  }

  SpreadsheetApp.getUi().alert('Hojas configuradas correctamente. Ahora importa los datos de cada categoría.');
}

// ══════════════════════════════════════════════════
// COLOREAR FILAS POR ESTADO — Ejecutar después de importar datos
// ══════════════════════════════════════════════════
function colorByStatus() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();

  sheets.forEach(sheet => {
    const name = sheet.getName();
    if (name === 'Config' || name === 'Resumen') return;

    const data = sheet.getDataRange().getValues();
    const statusCol = 4; // Columna D (estado)

    for (let i = 1; i < data.length; i++) {
      const status = String(data[i][statusCol - 1]).toLowerCase();
      const range = sheet.getRange(i + 1, 1, 1, data[0].length);

      if (status === 'disponible') {
        range.setBackground('#C8E6C9'); // Verde claro
      } else if (status === 'agotado') {
        range.setBackground('#FFCDD2'); // Rojo claro
      } else if (status === 'pedido') {
        range.setBackground('#FFF9C4'); // Amarillo claro
      }
    }
  });

  SpreadsheetApp.getUi().alert('Colores aplicados por estado.');
}
