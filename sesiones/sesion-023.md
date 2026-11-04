# Sesión 023 — 010-vista-admin: Fase 6-7, la web pública pasa a Firestore (2026-11-03)

**Fecha:** 2026-11-03
**Estado:** Cerrada — código local, **sin commit/push**, falta solo el visto
bueno final del propietario (regla suya: decide al terminar todas las fases)
**Objetivo:** Fase 6 (web pública lee de Firestore) y Fase 7 (verificar
seguridad de verdad), cerrando la implementación de `010-vista-admin`.

---

## Resumen

Esta fue la sesión de mayor riesgo de toda la feature — la primera que toca
`catalogo.js`, el archivo que sirve a los clientes reales. Se encontró y
resolvió un bug de datos genuino (dos productos con el mismo código en Sheets,
no detectado hasta ahora porque nunca antes el código se había usado como
identificador único). Se verificó, con una prueba real contra Firestore y no
solo mirando la pantalla, que la regla de seguridad efectivamente bloquea
escrituras no autorizadas.

---

## Temas cubiertos

### A. `js/firestore-catalogo.js` — módulo puente
Nuevo módulo ES que arma el mismo objeto `{ categoria: [productos] }` que antes
daba Sheets, consultando Firestore por categoría (un solo filtro de igualdad,
sin índice compuesto necesario; el filtro de `archivado` se hace en JavaScript,
no en la consulta, para no depender de otro índice).

**Decisión de diseño importante:** no se convirtió `catalogo.js` en módulo.
`catalogo_motor.js` lee la variable `CATALOGO` como global — un script módulo
no la expondría así sin cambios adicionales, y esa dependencia es exactamente
el contrato que `plan.md` pide no romper. En cambio, el módulo nuevo expone su
función en `window`, y `catalogo.js` espera a que aparezca con el mismo patrón
de `setTimeout` que el archivo ya usaba en `iniciarCatalogo()` — nada de
asumir el orden de carga entre un script clásico (no diferido) y uno módulo
(siempre diferido), que es donde está el riesgo real de esta clase de cambio.

### B. Bug de datos real: código duplicado en Sheets
Primera carga del catálogo público: **356 de 357**. Se investigó con el mismo
método que en la sesión 019 (no asumir, consultar Firestore directo) y se
encontró la causa: dos filas de `cadenas_dijes` en Google Sheets compartían el
código `P-CDD-221` ("Cadena con dije cubo" y "Cadena con dije cilindro"). Como
el código es el ID del documento en Firestore, la migración sobrescribió una
con la otra sin avisar de ningún error — es el comportamiento esperado de un
`set()` por ID, pero reveló un dato sucio que **no se había detectado antes**
porque hasta ahora el código nunca se había usado como identificador único de
nada.

El propietario le asignó un código nuevo a una de las dos filas en Sheets y
volvió a correr "Importar desde Sheets" (la misma herramienta de la Fase 2,
reutilizada tal como estaba pensada). Quedó en 357/357.

### C. Verificación completa del contrato público
Con el catálogo ya en 357, se verificó en un navegador real (headless, con
captura) que nada del sitio existente se rompió:
- 0 excepciones de JavaScript, 0 recursos con error.
- Los 357 productos agrupados en las 7 categorías correctas.
- La pieza archivada de prueba (`P-AR-570`, de la Fase 5) **no aparece** en el
  catálogo público — confirmado contando: aretes da 91, no 92.
- Clic en "Agregar" de una tarjeta real: el carrito se abre, muestra el
  producto correcto, el total calcula bien, el botón de WhatsApp tiene el
  número correcto.

### D. Verificación de seguridad en dos niveles (Fase 7)
La sesión 018 ya había probado el nivel de interfaz: con otra cuenta de
Google real, la pantalla de rechazo bloquea antes de ver el catálogo. Faltaba
el nivel de fondo — si alguien se salta la interfaz y llama a Firestore
directo, ¿la regla lo para igual?

Se probó sin ningún login: un intento de `updateDoc` sobre un producto real
devolvió `permission-denied` — `"Missing or insufficient permissions"`. Se
confirmó además, levantando el documento de nuevo, que el precio **no
cambió** (seguía en $20): el intento rechazado nunca llegó a aplicarse. La
protección real está en la regla del lado de Firestore, no en el frontend.

---

## Decisiones clave

| Decisión | Opción tomada | Alternativa |
|---|---|---|
| ¿`catalogo.js` se vuelve módulo? | No — se agregó un módulo puente aparte que expone su función en `window` | Convertirlo, arriesgando romper cómo `catalogo_motor.js` lee `CATALOGO` |
| Orden de carga script/módulo | Esperar con `setTimeout` (mismo patrón ya existente en el archivo) | Confiar en el orden de las etiquetas `<script>` en el HTML (no es seguro entre clásico y módulo) |
| Código duplicado encontrado | El propietario reasigna uno de los dos en Sheets, se re-migra | Resolverlo "a mano" directo en Firestore sin tocar la fuente |
| Verificación de seguridad | Escritura real sin login, revisando el resultado en Firestore | Confiar solo en que la pantalla de rechazo se vio bien en la sesión 018 |

---

## Archivos tocados

```
Paguina_joyas/
├── js/firestore-catalogo.js                   (??) NUEVO
├── catalogo.js                                 (M) — fetch(SHEETS_URL) → cargarDesdeFirestore()
├── index.html                                  (M) — <script type="module"> del nuevo archivo
└── spec/features/010-vista-admin/tasks.md      (M) — Fases 6 y 7 con evidencia
```

Fuera del repo: 1 producto recuperado en Firestore (código reasignado por el
propietario en Sheets, re-migrado).

---

## Pendientes

**Toda la implementación de `010-vista-admin` está construida y verificada**,
fase por fase, con evidencia real en cada una (no capturas de pantalla
solamente — consultas directas a Firestore, pruebas de seguridad reales,
conteos verificados contra datos en vivo).

**Lo único que falta es la decisión del propietario**, como pidió explícitamente
en la sesión 019: revisar todo de punta a punta en localhost y decidir si se
sube (commit + push) o si quiere algún ajuste antes.

---

## Nota de deploy

**No hubo deploy.** Todo local. El sitio público en producción
(`saidsoriano.github.io`) sigue sirviendo exactamente lo mismo que antes de
toda esta feature — nada de esto se sube hasta que el propietario lo apruebe.
