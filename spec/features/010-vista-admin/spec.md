# Especificación: Panel de administración

## Historia de usuario
> Como dueño de Silver Cow Ambato, quiero cambiar precios, marcar stock, subir fotos
> y agregar o archivar piezas del catálogo desde un panel web — sin tener que abrir
> Google Sheets — para manejar el negocio más rápido, desde la computadora o el
> celular.

## Por qué no es "ponerle una pantalla a lo que ya existe"
Hoy el sitio **no tiene nada que escriba**. `scripts/google_apps_script.js` solo
expone un `doGet()` de solo lectura. No existe ningún `doPost()`, ninguna base de
datos propia, ningún registro de pedidos. Construir este panel significa agregar
dos capacidades que hoy no existen: **algo que guarde datos** y **algo que los
modifique**, antes de que el panel tenga algo que mostrar o hacer.

## Decisiones cerradas con el propietario (sesión 017, 2026-11-03)

| Pregunta | Decisión |
|---|---|
| ¿Quién entra al panel? | Solo el propietario (`jhetro2005@gmail.com`), login con Google. Diseño pensado para poder sumar más cuentas después, pero v1 es de un solo usuario |
| ¿Qué pasa con Google Sheets? | **Se congela.** Deja de ser leído y escrito por cualquier parte del sistema — ni la web pública, ni el panel. Queda como una foto fija del catálogo al momento de la migración, por si alguna vez hace falta consultarlo |
| ¿Dónde vive el dato en vivo? | **Firestore** (Firebase) reemplaza a Sheets como única fuente de verdad, tanto para el panel como para la web pública |
| ¿Dónde viven las fotos? | Las **357 fotos actuales se quedan donde están** (en el repo, servidas por GitHub Pages) — no se migran. Firestore guarda esa misma URL para cada producto existente. Las fotos **nuevas** (subidas desde el panel, de ahora en adelante) van a **Supabase Storage** |
| ¿Cómo se identifica el admin? | Google Sign-In vía Firebase Authentication, restringido por reglas de seguridad al correo `jhetro2005@gmail.com` — no hay contraseña propia que gestionar |
| ¿Qué pasa al "quitar" una pieza? | **Se archiva, no se borra.** Desaparece de la web pública pero queda recuperable desde el panel |
| ¿Cómo se asigna el código de una pieza nueva? | El propietario elige categoría y nombre; **el panel genera el código automático** (siguiente número disponible de esa categoría, ej. `P-AN-253`) |
| ¿Desde dónde se usa el panel? | Celular y computadora — tiene que funcionar bien angosto |
| ¿Hace falta backend propio (servidor Node, etc.)? | **No.** El panel habla directo con Firestore/Storage desde el navegador, protegido por reglas de seguridad. Decisión tomada explícitamente para evitar mantener y pagar un servidor aparte |

## Por qué Firebase + Supabase combinados (no todo en uno)
Firebase Storage **dejó de estar disponible en el plan gratis el 3 de febrero de
2026** — ahora exige el plan de pago (Blaze), que pide una tarjeta registrada con un
prepago único de USD 30 para activar la facturación. El propietario tuvo una mala
experiencia previa con reembolsos de Google y decidió explícitamente no poner una
tarjeta ahí. Por eso las fotos nuevas se separan a Supabase Storage, que sigue
siendo gratis sin tarjeta. Firestore y Authentication sí siguen gratis en el plan
Spark de Firebase sin este problema, así que se quedan ahí.

## Infraestructura ya creada (sesión 017)

| Servicio | Proyecto | Plan | Uso |
|---|---|---|---|
| Firebase | `silver-cow-admin` | Spark (gratis) | Firestore (datos) + Authentication (login Google) |
| Supabase | `silver-cow-storage` (org `silver-cow-storage`, Free) | Free | Storage — bucket `fotos-productos` (público), fotos nuevas |

Authentication: proveedor Google activado, correo de asistencia
`jhetro2005@gmail.com`, nombre público del proyecto cambiado a algo reconocible
para que la pantalla de consentimiento de Google no muestre un ID genérico.

Storage: bucket `fotos-productos` creado como público, con 4 políticas
(`SELECT`/`INSERT`/`UPDATE`/`DELETE`) aplicadas a `public` sobre
`bucket_id = 'fotos-productos'`.

> **Nota de seguridad, dicha sin vueltas:** como no usamos el login propio de
> Supabase, las políticas del bucket quedan abiertas a cualquiera que tenga la
> clave pública (`sb_publishable_...`, que no es secreta, está pensada para
> exponerse en el navegador). La protección real es que la URL del panel no está
> enlazada en ningún lado público y que escribir en Firestore sí exige el login de
> Google del propietario. Para fotos de joyería (no datos personales ni dinero), es
> un riesgo bajo y aceptado explícitamente por el propietario. Ver plan.md para
> cómo se endurece esto si hace falta más adelante.

## Criterios de aceptación

### A — Acceso
- [ ] El panel exige login con Google antes de mostrar cualquier dato
- [ ] Solo `jhetro2005@gmail.com` puede escribir en Firestore (verificado por reglas
      de seguridad, no solo por el frontend)
- [ ] Cualquier otra cuenta de Google puede iniciar sesión pero no puede guardar
      ningún cambio (las reglas lo bloquean)
- [ ] El panel se ve y funciona bien en una pantalla de celular (375px de ancho)

### B — Migración única de datos
- [ ] Los 357 productos actuales de Sheets quedan copiados en Firestore, con los
      mismos campos (nombre, precio, código, estado, descripción, imagen, esPedido)
- [ ] La migración se corre una sola vez, desde el propio panel (sin script aparte
      ni credenciales nuevas que gestionar)
- [ ] Después de la migración, Sheets no se vuelve a leer ni a escribir desde
      ninguna parte del sitio

### C — Editar catálogo
- [ ] Cambiar precio de una pieza existente
- [ ] Cambiar estado (disponible / pedido / agotado)
- [ ] Reemplazar la foto de una pieza existente (sube a Supabase, actualiza la URL
      en Firestore)
- [ ] Editar nombre y descripción

### D — Agregar y archivar piezas
- [ ] Agregar pieza nueva: el propietario elige categoría, nombre, precio, estado,
      descripción y sube una foto; el código se genera solo
- [ ] Archivar una pieza (no se borra; desaparece de la web pública, queda
      recuperable desde el panel)
- [ ] Desarchivar una pieza archivada

### E — La web pública refleja los cambios
- [ ] `catalogo.js` deja de leer de Apps Script/Sheets y pasa a leer de Firestore
- [ ] Un cambio hecho en el panel se ve en la web pública sin tocar código ni
      hacer deploy
- [ ] Las piezas archivadas no aparecen en el catálogo público
- [ ] El carrito, el mensaje de WhatsApp y el resto del sitio siguen funcionando
      exactamente igual que hoy (mismo contrato: `crearTarjeta()`, `.joya-card`,
      `agregarAlCarrito()`, etc.)

## Explícitamente fuera de alcance (v1)
- Más de un usuario con acceso al panel (diseño lo permite después, no se
  construye ahora)
- Registro/historial de pedidos de clientes (no se pidió; "ver pedidos" quedó
  descartado en la conversación de requerimientos a favor de "controlar el
  catálogo")
- Borrado permanente de piezas (se decidió archivar, no borrar)
- Cualquier lógica de servidor (Cloud Functions, backend propio) — todo corre
  desde el navegador

## Criterios de éxito
- El propietario puede cambiar un precio y verlo reflejado en la web pública en
  menos de un minuto, sin tocar Sheets ni código
- Nadie que no sea el propietario puede modificar el catálogo, aunque conozca la
  URL del panel
- Los 357 productos existentes siguen viéndose exactamente igual después de la
  migración
