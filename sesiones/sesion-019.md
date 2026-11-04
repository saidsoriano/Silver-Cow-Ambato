# Sesión 019 — 010-vista-admin: Fase 2, migración completa (2026-11-03)

**Fecha:** 2026-11-03
**Estado:** Cerrada — código local, **sin commit/push** (el propietario pidió
explícitamente: avanzar fase por fase, verificando y documentando cada una, y
decidir si sube **todo junto al final**, no por fase)
**Objetivo:** Fase 2 de `010-vista-admin` — migrar los 357 productos de Google
Sheets a Firestore, continuando directo de la sesión 018.

---

## Resumen

Se escribió el botón de migración y se corrió dos veces. El primer intento trajo
356 de 357 — exactamente el producto con código vacío que ya estaba documentado
como dato sucio desde antes. El propietario le asignó código en Sheets a mano, se
corrió de nuevo, y quedaron los 357 en Firestore con los mismos conteos por
categoría que ya constaban en `01-Estado-Actual.md`.

---

## Temas cubiertos

### A. Reglas de seguridad — primer bloqueo real
Antes de poder escribir nada, hubo que publicar las reglas de Firestore (quedaron
pendientes desde el final de la sesión 017/018). El propietario intentó migrar sin
haberlas publicado — Firestore devolvió `FirebaseError: Missing or insufficient
permissions`, visible en la consola del navegador. Se confirmó con una captura que
las reglas seguían siendo las de prueba por defecto (`allow read, write: if
false;`). Pegó las reglas reales, publicó, y recién ahí funcionó.

### B. `js/admin/migracion.js` escrito
Lee el mismo endpoint de `catalogo.js` (sin tocarlo), agrupa por categoría, y
escribe en Firestore con `writeBatch` (lotes de 400, aunque con 357 entra en uno
solo). ID del documento = el campo `codigo` del JSON, al que hay que quitarle los
corchetes (`"[P-AN-368]"` → `"P-AN-368"`) — se verificó el formato real contra el
endpoint en vivo antes de escribir el código, no se asumió.

### C. Bug de datos, no de código — 356 de 357
Primer resultado: **356 productos**, no 357. Se investigó cuál faltaba en vez de
asumir un bug del script: un producto de `cadenas_dijes` ("Cadena con Dije
corazón") no tiene código en ningún lado — ni en el campo `codigo` ni en `desc`.
Coincide exactamente con lo ya anotado en `01-Estado-Actual.md` desde una sesión
anterior: *"el vacío de cadenas_dijes sí se nota: tarjeta sin badge y WhatsApp sin
referencia"*. No es un bug nuevo de esta sesión, es el mismo dato sucio de
siempre, ahora con consecuencia real (sin código no hay cómo guardarlo en
Firestore, que usa el código como identificador único).

Se le preguntó al propietario qué hacer: asignarle código en Sheets, o dejarlo
afuera. Eligió asignarlo. El botón de migración está diseñado para sobrescribir
por código sin duplicar, así que correrlo de nuevo fue seguro — 357/357 en el
segundo intento.

---

## Decisiones clave

| Decisión | Opción tomada | Alternativa |
|---|---|---|
| Qué hacer con el producto sin código | El propietario le asignó código en Sheets | Dejarlo fuera del panel nuevo |
| Reintentar la migración | Correr el mismo botón de nuevo (sobrescribe, no duplica) | Escribir una migración distinta "solo para el faltante" |
| Ritmo de la feature | **Fase por fase, con verificación y documentación de cada una; decisión de subir (commit/push) recién al final de todas las fases** — pedido explícito del propietario en esta sesión | Subir avances parciales en el camino |

---

## Archivos tocados

```
Paguina_joyas/
├── js/admin/migracion.js                    (??) NUEVO
├── admin.html                                (M) — botón + script de migración
└── spec/features/010-vista-admin/
    ├── plan.md                               (M) — corregido: img es ruta relativa,
    │                                               no URL completa; nota sobre
    │                                               corchetes del campo codigo
    └── tasks.md                              (M) — Fase 2 tachada con evidencia
```

Fuera del repo: 357 documentos creados en la colección `productos` de Firestore
(proyecto `silver-cow-admin`). Reglas de seguridad publicadas en el mismo
proyecto.

Nada del sitio público se tocó.

---

## Pendientes

**Confirmado por el propietario en esta sesión:** no se sube nada a git hasta
terminar todas las fases y dar el visto bueno final. Se sigue así el resto de la
feature.

**Implementación:** Fases 3 a 7 de `spec/features/010-vista-admin/tasks.md` —
CRUD del catálogo, fotos, alta de piezas, cambio de la web pública a Firestore,
reglas de seguridad finales (las actuales ya son las reales, no las de prueba, así
que la Fase 7 queda más corta de lo previsto).

---

## Nota de deploy

**No hubo deploy.** El sitio público sigue exactamente igual.
