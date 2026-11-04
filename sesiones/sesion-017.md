# Sesión 017 — 010-vista-admin: requerimientos + infraestructura (2026-11-02/03)

**Fecha:** 2026-11-02, continúa 2026-11-03
**Estado:** Cerrada — documentación y configuración de infraestructura; **sin código
todavía**
**Objetivo:** Arrancar la feature `010-vista-admin` (pendiente desde la sesión 013):
definir requerimientos reales con el propietario, elegir arquitectura, y dejar la
infraestructura externa (Firebase, Supabase) creada y configurada a mano.

---

## Resumen

El propietario pidió continuar la feature de vista admin. Como no tenía carpeta,
spec ni plan, se arrancó con `brainstorming` antes de tocar nada. Se descubrió que
el pedido original del roadmap ("ver pedidos o gestionar inventario") no tenía
ninguna de las dos piezas construidas — ni almacenamiento de pedidos, ni capacidad
de escritura en ningún lado. Tras varias rondas de preguntas, el propietario definió
el alcance real: **control completo del catálogo** (precio, stock, fotos, altas,
archivado) desde un panel, sin tocar Sheets. Se investigaron costos reales (no de
memoria) de las dos arquitecturas posibles, se decidió la combinación Firebase +
Supabase, y se armó la infraestructura externa guiando al propietario paso a paso
por las consolas de ambos servicios.

---

## Temas cubiertos

### A. Brainstorming — alcance real
Se usó la skill `brainstorming` (obligatoria antes de feature nueva). Hallazgo
inicial: `doGet()` de Apps Script es de solo lectura, no existe `doPost()`, no hay
registro de pedidos en ningún lado. "Ver pedidos" y "gestionar inventario" partían
de cero, no de algo a medio hacer.

Primera pregunta respondida por el propietario: **"poder cambiar precios y stock sin
entrar a Sheets, y subir las fotos de las joyas o quitar, prácticamente controlar el
catálogo"** — esto fijó el alcance real, más amplio que la frase original del
roadmap.

### B. Dos arquitecturas evaluadas
1. **Apps Script como mini-backend** — Sheets sigue siendo la base de datos viva,
   se le agrega `doPost()`. Sin costo, sin piezas nuevas, pero atado a los límites
   de cuota de Apps Script.
2. **Base de datos propia (Firebase/Supabase), sin servidor** — el panel habla
   directo con la base desde el navegador, protegido por reglas de seguridad. Más
   piezas, pero no requiere mantener ni pagar un servidor aparte (hallazgo de la
   investigación: no hace falta Cloud Functions para CRUD simple).

El propietario, tras una confusión inicial sobre si Sheets "se sincroniza" o queda
congelado, **eligió la opción 2**, con Sheets congelado (sin leer ni escribir nunca
más desde ningún lado) en vez de sincronizado.

### C. Investigación de costos (con fuentes, no de memoria)
- **Firebase (Spark, gratis):** Firestore 1 GiB, 50K lecturas/20K escrituras por
  día — de sobra para 357 productos. Authentication hasta 50K usuarios, gratis.
- **Firebase Storage:** se investigó "5 GB gratis" (cierto hasta hace poco), pero
  al intentar activarlo en la consola real **salió el requisito del plan Blaze**.
  Se volvió a investigar: **desde el 3 de febrero de 2026, Cloud Storage dejó de
  estar disponible en el plan Spark**, cambio de política confirmado en
  `firebase.google.com/pricing` directamente. Blaze además pidió un **prepago único
  de USD 30**, supuestamente reembolsable.
- El propietario rechazó Blaze por una mala experiencia previa real con reembolsos
  de Google — no se insistió, se buscó alternativa.
- **Supabase (Free):** Postgres 500 MB, Storage 1 GB, sin tarjeta. Advertencia real
  encontrada: el proyecto se pausa si no hay actividad en 7 días. Se evaluó como
  aceptable porque el tráfico normal del catálogo (clientes viendo fotos) debería
  mantenerlo activo.

Decisión final: **Firestore + Authentication en Firebase** (gratis, sin tarjeta),
**Storage en Supabase** (gratis, sin tarjeta) — combinación que evita el muro de
Blaze sin perder ninguna funcionalidad pedida.

### D. Requerimientos cerrados con el propietario
| Punto | Decisión |
|---|---|
| Acceso | Solo el propietario, login con Google (`jhetro2005@gmail.com`) |
| "Quitar" una pieza | Se archiva, no se borra — recuperable |
| Código de pieza nueva | Automático, el propietario solo elige categoría y nombre |
| Fotos existentes (357) | Se quedan donde están (GitHub Pages); solo las nuevas van a Supabase |
| Uso | Celular y computadora |
| Login técnico | Capa 1 (puede entrar) vs. Capa 2 (puede escribir) explicado — la protección real está en las reglas de Firestore, no en el botón de Google |

### E. Infraestructura armada a mano (guiada paso a paso, con capturas)
- Proyecto Firebase `silver-cow-admin`, plan Spark confirmado en pantalla.
- Firestore Database creado, edición **Standard** (no Enterprise — esa es para
  apps mucho más grandes, no la necesitamos).
- Authentication: proveedor Google activado, correo de asistencia
  `jhetro2005@gmail.com`, nombre público del proyecto corregido (evita que la
  pantalla de login de Google muestre un ID genérico tipo `project-618236546317`).
- Proyecto Supabase `silver-cow-storage` (organización Free, sin GitHub conectado
  — no hace falta para este uso).
- Bucket `fotos-productos`, público.
- Política de Storage: **primer intento falló** — se pegó un `CREATE POLICY`
  completo dentro del campo que solo esperaba la condición booleana, Postgres tiró
  error de sintaxis (`ERROR: 42601... at or near "CREATE"`). Corregido dejando solo
  `bucket_id = 'fotos-productos'` en ese campo; el formulario arma el resto. Quedó
  separado en 4 políticas (una por operación: SELECT/INSERT/UPDATE/DELETE),
  equivalente a la única política `FOR ALL` que se había pedido.
- Datos de conexión confirmados: Project URL
  `https://jgzysksqcgqasmhvromp.supabase.co`, clave pública
  `sb_publishable_ummHco3IH9x6GIbxmViY8Q_eshIOM5C` (clave segura para el
  navegador, no es secreta).

### F. Documentación generada
Al no existir carpeta de la feature, se creó completa siguiendo el mismo molde que
`008-rediseno-premium`:
- `spec/features/010-vista-admin/spec.md`
- `spec/features/010-vista-admin/plan.md`
- `spec/features/010-vista-admin/tasks.md`

---

## Decisiones clave

| Decisión | Opción tomada | Alternativa descartada |
|---|---|---|
| Arquitectura | Firebase (Firestore+Auth) + Supabase (Storage), sin servidor propio | Apps Script `doPost()` sobre Sheets vivo; backend propio (Node/servidor) |
| Billing de Firebase | Quedarse en Spark, mover Storage a Supabase | Pasar a Blaze (rechazado por mala experiencia previa del propietario con reembolsos) |
| Destino de Sheets | Congelado, sin sincronizar | Mantenerlo como base viva (Opción 1) o sincronizado con la base nueva |
| Fotos existentes | Se quedan en GitHub Pages, no se migran | Copiar las 357 a Supabase también |
| Borrado de piezas | Archivar | Borrado permanente |
| Código de pieza nueva | Automático por categoría | El propietario lo escribe a mano |
| Migración de datos | Botón dentro del propio panel, misma sesión logueada | Script de Node aparte con clave de servicio Firebase Admin |
| Login del panel | Google Sign-In (Firebase Auth) | Usuario/contraseña propios — el propietario lo propuso por una confusión (pensó que afectaba a los clientes), se aclaró y confirmó Google igual |

---

## Archivos tocados

```
Paguina_joyas/
├── spec/features/010-vista-admin/
│   ├── spec.md    (??) NUEVO
│   ├── plan.md    (??) NUEVO
│   └── tasks.md   (??) NUEVO
└── sesiones/sesion-017.md   (??) NUEVO — este archivo
```

Sin cambios de código. Nada en `index.html`, `estilos.css`, `catalogo.js` ni
ningún `js/` del sitio público.

Infraestructura externa creada (no vive en este repo): proyecto Firebase
`silver-cow-admin`, proyecto Supabase `silver-cow-storage`.

---

## Pendientes

**Técnico, antes de poder escribir código:**
- Registrar la app web en Firebase (Configuración del proyecto → Tus apps → `</>`)
  para obtener `apiKey`/`authDomain`/`projectId`. Se llegó a planear este paso pero
  la sesión se desvió al problema de Firebase Storage antes de completarlo.

**Implementación completa:** ver `spec/features/010-vista-admin/tasks.md`,
Fases 1 a 7 — conexión/login, migración, CRUD, fotos, alta de piezas, cambio de la
web pública a Firestore, reglas de seguridad finales.

**De decisión del propietario, no urgente:** si algún día se quiere cerrar más la
política abierta de Storage (hoy pública), la opción queda anotada en `plan.md` —
activar login de Google también en Supabase.

---

## Nota de deploy

**No hubo deploy.** Toda la sesión fue brainstorming, decisiones e infraestructura
externa (consolas de Firebase/Supabase). El sitio público y el repo no cambiaron.
