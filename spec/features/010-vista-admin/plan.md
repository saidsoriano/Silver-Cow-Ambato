# Plan técnico: Panel de administración

## Principios
1. **Vanilla, sin build**, igual que el resto del sitio — el panel es HTML/CSS/JS
   ES6 que se conecta a Firebase/Supabase por sus SDK vía `<script type="module">`,
   sin bundler ni framework.
2. **Sin backend propio.** Nada de Cloud Functions ni servidor Node. Todo el
   escribir/leer pasa directo del navegador a Firestore/Supabase, protegido por
   reglas de seguridad, no por código de servidor.
3. **No tocar el contrato del motor público.** `crearTarjeta()`, `.joya-card`,
   `agregarAlCarrito()`, `localStorage`, el carrito, el mensaje de WhatsApp — nada
   de eso cambia. Solo cambia **de dónde** vienen los datos (`catalogo.js`).
4. **Aprobación por fase.** Local → visto bueno del propietario → git, igual que
   toda sesión anterior.

## Infraestructura (ya creada, sesión 017)

```
Firebase (proyecto "silver-cow-admin", plan Spark — gratis)
├── Firestore          → datos del catálogo (única fuente de verdad)
└── Authentication     → login Google, restringido por reglas a jhetro2005@gmail.com

Supabase (proyecto "silver-cow-storage", plan Free)
└── Storage            → bucket "fotos-productos" (público)
                          solo fotos NUEVAS o reemplazadas desde el panel

GitHub Pages (sin cambios)
└── Fotos de los 357 productos existentes, servidas como hoy
```

Falta todavía (pendiente de la próxima sesión con el propietario): registrar la
app web en Firebase (Configuración del proyecto → Tus apps → `</>`) para obtener
`apiKey`, `authDomain`, `projectId`, etc. Sin eso no se puede escribir el código
de conexión.

## Modelo de datos (Firestore)

Una sola colección `productos`, documento por pieza, **ID del documento = código**
(ej. `P-AN-253`) — evita inventar un ID aparte, el código ya es único por diseño.

```
productos/
  P-AN-253/
    nombre:      "Anillo solitario"
    categoria:   "anillos"          // aretes | anillos | dijes | pulseras | cadenas | juegos | cadenas_dijes
    precio:      45.00
    estado:      "disponible"        // disponible | pedido | agotado
    esPedido:    true
    desc:        "Plata Ley 925, piedra circonia..."
    img:         "anillos/P-AN-253.jpg"
                 // ruta relativa, igual que hoy en Sheets — se resuelve desde la
                 // raíz del sitio, exactamente como ya lo usa crearTarjeta().
                 // Fotos nuevas: URL completa de Supabase en vez de ruta relativa
                 // (https://jgzysksqcgqasmhvromp.supabase.co/storage/v1/object/public/fotos-productos/...)
    archivado:   false
    actualizado: <timestamp>
```

`archivado: true` = la pieza no aparece en el catálogo público, pero sigue en
Firestore y es recuperable desde el panel. La consulta pública siempre filtra
`archivado == false`.

## Reglas de seguridad de Firestore

Esta es la protección real del sistema — no el frontend.

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /productos/{codigo} {
      allow read: if true;  // la web pública lee sin login
      allow write: if request.auth != null
                    && request.auth.token.email == 'jhetro2005@gmail.com';
    }
  }
}
```

Cualquiera puede *ver* el catálogo (así funciona la web pública). Solo ese correo
exacto, logueado con Google, puede *escribir*.

## Código automático por categoría

Al agregar una pieza: el panel consulta todos los documentos de esa `categoria`,
extrae el número de cada código (`P-AN-118` → `118`), toma el máximo, propone
`máximo + 1`. Con ~40-100 piezas por categoría es una consulta barata, no hace
falta un contador aparte.

## Migración de Sheets a Firestore (dentro del panel, no un script aparte)

Un botón único en el panel, **"Importar desde Sheets"**, pensado para correrse una
sola vez:

1. Hace `fetch()` al mismo endpoint público que ya usa `catalogo.js` hoy
   (`scripts/google_apps_script.js` → `doGet()`), que no cambia ni se toca.
2. Por cada producto, crea un documento en `productos/` con el código como ID
   (el JSON trae un campo `codigo` con corchetes, ej. `"[P-AN-368]"` — se le
   quitan los corchetes para el ID del documento; `desc` se guarda tal cual viene,
   con el corchete adentro, porque `crearTarjeta()` ya sabe parsearlo de ahí),
   `archivado: false`, y `img` tal cual viene (ruta relativa, ej.
   `"anillos/anillo_1.jpg"` — no se sube ninguna foto en este paso, se reutiliza
   la que ya existe).
3. Corre bajo la misma sesión logueada del propietario, así que usa la misma regla
   de seguridad que cualquier otra escritura — no se necesita una clave de servicio
   aparte ni un script de Node independiente.
4. Al terminar, muestra cuántos productos se crearon y si hubo algún error.

Decisión de diseño: evitar un script de migración separado con credenciales de
administrador (Firebase Admin SDK + clave de servicio) porque agrega una pieza más
para perder o filtrar. El mismo panel, con el mismo login, hace el trabajo.

## Cambio en la web pública

`catalogo.js` hoy hace `fetch(SHEETS_URL)` y cachea en `localStorage`
(`silvercow_catalogo`). Pasa a:

```js
// en vez de fetch(SHEETS_URL)
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
// trae los productos con archivado == false, agrupados por categoria,
// arma el mismo objeto { categoria: [productos] } que ya espera catalogo_motor.js
```

El objeto que llega a `catalogo_motor.js` queda **con la misma forma exacta** que
hoy — `crearTarjeta()` no se entera de que cambió la fuente. La caché en
`localStorage` se mantiene igual, mismo patrón de refresco en segundo plano.

`scripts/google_apps_script.js` **no se borra** — queda intacto, sin usarse, como
respaldo de lectura si algún día hiciera falta. No se despliega nada nuevo ahí.

## Archivos nuevos

```
Paguina_joyas/
├── admin.html                    nuevo — el panel en sí, no enlazado desde index.html
├── js/admin/
│   ├── firebase-config.js        nuevo — apiKey, authDomain, etc. (público, no es secreto)
│   ├── auth.js                   nuevo — login Google + verificación de correo
│   ├── productos.js              nuevo — CRUD contra Firestore (leer/crear/editar/archivar)
│   ├── fotos.js                  nuevo — subida a Supabase Storage
│   ├── codigo-automatico.js      nuevo — siguiente número por categoría
│   └── migracion.js              nuevo — botón "Importar desde Sheets", un solo uso
├── css/admin.css                 nuevo — estilo propio del panel, responsive celular+compu
└── catalogo.js                   (M) — fetch(SHEETS_URL) → lectura de Firestore
```

`admin.html` no se agrega a la navbar ni al footer del sitio público — se llega
solo conociendo la URL directamente.

## Fases de implementación

### Fase 0 — Infraestructura (hecho en sesión 017)
Firebase (Firestore + Auth) y Supabase (Storage) creados y configurados a mano en
consola. Falta solo registrar la app web en Firebase para sacar la config.

### Fase 1 — Conexión y login
`firebase-config.js`, `auth.js`. Pantalla de login, bloqueo si el correo no
coincide. Verificar en consola de Firebase que el intento de otra cuenta se
rechaza.

### Fase 2 — Migración
`migracion.js` + botón en el panel. Correr una sola vez, verificar los 357
productos en Firestore contra lo que hoy muestra la web.

### Fase 3 — CRUD del catálogo
`productos.js`: listar, editar precio/estado/nombre/descripción, archivar/
desarchivar. Tabla o lista responsive.

### Fase 4 — Fotos
`fotos.js`: subir a Supabase, reemplazar foto de pieza existente.

### Fase 5 — Agregar pieza + código automático
`codigo-automatico.js` + formulario de alta.

### Fase 6 — Cambiar la web pública a Firestore
Editar `catalogo.js`. Mostrar en localhost, comparar contra la versión con Sheets
antes de aprobar. Smoke test: 357 productos, 7 categorías, carrito y WhatsApp
intactos.

### Fase 7 — Reglas de seguridad + revisión final
Publicar las reglas de Firestore reales (no las de prueba por defecto). Verificar
con una cuenta de Google distinta que no puede escribir.

## Cómo se endurece la seguridad de Storage más adelante (si hace falta)
Hoy las políticas de Supabase Storage están abiertas a `public` porque no usamos su
sistema de login. Si en el futuro se quiere cerrar esto, la opción es activar
Google Sign-In también en Supabase Auth (mismo proveedor que ya usa Firebase) y
restringir las políticas a `auth.role() = 'authenticated'` en vez de `public`. No
es necesario para v1, queda anotado para no perderlo.
