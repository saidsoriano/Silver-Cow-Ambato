# Tareas: Panel de administración

> Tachado = verificado de verdad (configuración vista en pantalla o campo
> confirmado). Sin tachar = pendiente real, no olvido.

## Fase 0 — Infraestructura
- [x] Proyecto Firebase creado (`silver-cow-admin`), plan Spark confirmado
- [x] Firestore Database creado, edición Standard
- [x] Authentication activado, proveedor Google, correo de asistencia
      `jhetro2005@gmail.com`
- [x] Nombre público del proyecto cambiado (no queda el ID genérico en la pantalla
      de login de Google)
- [x] Proyecto Supabase creado (`silver-cow-storage`), organización Free
- [x] Bucket `fotos-productos` creado, público
- [x] 4 políticas de Storage (SELECT/INSERT/UPDATE/DELETE) sobre
      `bucket_id = 'fotos-productos'`, aplicadas a `public`
- [x] Project URL de Supabase confirmada:
      `https://jgzysksqcgqasmhvromp.supabase.co`
- [x] Clave pública de Supabase confirmada (`sb_publishable_...`)
- [x] App web registrada en Firebase (`silver-cow-admin`), config obtenida:
      `apiKey`, `authDomain: silver-cow-admin.firebaseapp.com`,
      `projectId: silver-cow-admin`, `messagingSenderId: 618236546317`,
      `appId: 1:618236546317:web:fc738ba683c06c9a1b3444`.
      (`storageBucket` del bloque no se usa — las fotos van por Supabase, no por
      Firebase Storage)

## Fase 1 — Conexión y login
- [x] `js/admin/firebase-config.js` con la config real de Firebase (SDK 13.2.0 —
      la 13.1.1 no existía en el CDN, daba 404, corregido)
- [x] `js/admin/auth.js`: botón de login Google, pantallas de login/panel/rechazo
- [x] Verificado por el propietario en localhost: con `jhetro2005@gmail.com` entra
      al panel; con otra cuenta de Google, el login funciona pero la pantalla de
      rechazo lo bloquea antes de ver nada del catálogo

## Fase 2 — Migración
- [x] Botón "Importar desde Sheets" en el panel (`js/admin/migracion.js`)
- [x] Reglas de Firestore publicadas (el propietario había dejado las de
      prueba por defecto, `if false`, corregido en vivo)
- [x] Primer intento: 356/357 — 1 producto sin código en ningún lado
      (`cadenas_dijes`, "Cadena con Dije corazón", dato sucio ya conocido
      desde [[Paguina_joyas/05-Reporte-Datos-Sheets]]); el propietario le
      asignó código en Sheets
- [x] Corrido de nuevo (el botón sobrescribe por código, no duplica): 357/357
- [x] Verificado: conteo por categoría coincide con `01-Estado-Actual.md`
      (aretes 91, anillos 81, dijes 41, pulseras 39, cadenas 39, juegos 36,
      cadenas_dijes 30)

## Fase 3 — CRUD del catálogo
- [x] Listar productos en el panel (`js/admin/productos.js`, pestañas por categoría)
- [x] Editar precio
- [x] Editar estado (disponible/pedido/agotado)
- [x] Editar nombre — verificado en vivo por el propietario (guardar + ✓)
- [x] Editar descripción — agregado el `<textarea>` que faltaba; al guardar
      vuelve a anteponer `[codigo]` para no romper `crearTarjeta()`
- [x] Archivar pieza (no la borra) — verificado en vivo
- [x] Desarchivar pieza — verificado en vivo
- [x] Tamaño de la foto en la lista ajustado a pedido del propietario: 48px → 200px
- [x] Buscador por nombre o código (no estaba en el plan original; hueco real
      detectado por el propietario, sumado acá) — filtro client-side sobre la
      categoría ya cargada, sin tildes (NFD + rango Unicode de acentos)
- [x] Etiquetas en cada campo (Nombre/Precio (USD)/Estado/Descripción) y
      espacio entre el buscador y las pestañas — ajustes de claridad a pedido
      del propietario

## Fase 4 — Fotos
- [x] Subir foto nueva a Supabase Storage desde el panel (`js/admin/fotos.js`,
      `js/admin/supabase-config.js`)
- [x] Reemplazar la foto de una pieza existente — mismo botón, sobrescribe por
      nombre de archivo (`{codigo}.ext`, `upsert: true`), no acumula huérfanas
- [x] Verificado en vivo por el propietario: sube, dice "Subiendo..." → "¡Listo!",
      la imagen de la fila se actualiza al toque

## Fase 5 — Agregar pieza nueva
- [x] Formulario: categoría, nombre, precio, estado, descripción, foto
      (`js/admin/alta.js`, prefijos verificados contra el catálogo real)
- [x] Código automático (`js/admin/codigo-automatico.js`): siguiente número libre
      de la categoría elegida, muestra preview antes de guardar
- [x] Verificado en vivo por el propietario: pieza agregada, aparece en la lista
- [x] Bug propio corregido: `alta.js` buscaba un elemento `"panelAlta"` que no
      existía en el HTML (el id real era `"formAlta"`) — `TypeError: Cannot set
      properties of null`. Se verificaron además todos los demás `getElementById`
      de los 4 archivos de `js/admin/` contra el HTML real, no solo el que falló
- [x] Bug de navegador corregido: los `<select>` (categoría y estado) mostraban
      letras claras sobre fondo blanco nativo al desplegarse — invisibles.
      Arreglado con `color-scheme: dark` + color explícito en `<option>`, aplica
      a todos los desplegables del panel por compartir la clase `.admin-select`

## Fase 6 — Web pública a Firestore
- [x] `js/firestore-catalogo.js` (módulo nuevo) consulta Firestore y arma el
      mismo objeto `{ categoria: [productos] }` que antes daba Sheets
- [x] `catalogo.js` espera a que el módulo esté listo (mismo patrón de
      `setTimeout` que ya usaba `iniciarCatalogo()`) en vez de asumir el orden
      de carga entre script clásico y módulo — `catalogo_motor.js` no se tocó
- [x] Mostrado en localhost, verificado con navegador real (headless + captura)
- [x] Smoke test: 357 productos, 7 categorías (conteos exactos contra
      `01-Estado-Actual.md`), 0 excepciones de consola, 0 recursos con error,
      carrito agrega producto correcto, botón de WhatsApp con el número correcto
- [x] Las piezas archivadas no aparecen en el catálogo público — confirmado
      (la de prueba `P-AR-570` quedó fuera, aretes dio 91 y no 92)

**Bug de datos encontrado en esta fase (no es un bug de código):** dos filas
distintas de `cadenas_dijes` en Google Sheets compartían el mismo código
`P-CDD-221` ("Cadena con dije cubo" y "Cadena con dije cilindro"). Como el
código es el ID del documento en Firestore, la migración sobrescribió una con
la otra sin avisar — primer síntoma: el catálogo público mostraba 356 en vez
de 357. El propietario le asignó un código nuevo a una de las dos en Sheets y
se volvió a correr "Importar desde Sheets"; quedó en 357/357.

## Fase 7 — Seguridad y cierre
- [x] Reglas de seguridad de Firestore publicadas (sesión 019) — no las de
      prueba por defecto
- [x] Probado que la escritura se rechaza de verdad, en dos niveles:
      (1) el propietario probó con otra cuenta de Google real (sesión 018) y
      la pantalla de rechazo lo bloqueó antes de ver el catálogo;
      (2) se probó **sin ningún login** llamando a Firestore directo —
      `permission-denied`, confirmado que el precio del producto no cambió
- [ ] Visto bueno del propietario en localhost
- [ ] Commit + push

## Cierre
- [ ] `sesiones/sesion-0XX.md` de la sesión que implemente esto, escrita
- [ ] `roadmap.md`: `010-vista-admin` pasa a ✅ Completa
- [ ] `01-Estado-Actual.md` actualizado con el estado real de Sheets (congelado,
      ya no es la fuente de verdad)
- [ ] `mission.md`: el objetivo "Ser fácil de actualizar para el dueño (sin código,
      solo Google Sheets)" deja de ser cierto — actualizar a "solo el panel de
      administración"
