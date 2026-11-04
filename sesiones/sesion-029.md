# Sesión 029 — 011-arreglos-pagina: filtros de estado en el panel (2026-11-04)

**Fecha:** 2026-11-04
**Estado:** Cerrada — código local, **sin commit/push**
**Objetivo:** Agregar filtros por estado (Disponible / Bajo pedido /
Agotado) junto al buscador del panel admin.

---

## Resumen

El propietario pidió poder filtrar la lista de productos del panel — ej.
ver solo lo que está "bajo pedido" o solo lo "disponible" — sin tener que
leer fila por fila. Se agregaron 3 botones de filtro, combinables entre sí
y con el buscador de texto que ya existía.

---

## Temas cubiertos

### A. Botones de filtro (`admin.html`, `css/admin.css`)
3 botones tipo píldora ("Disponible" / "Bajo pedido" / "Agotado") entre el
buscador y la lista. Mismo lenguaje visual que las pestañas de categoría
(dorado cuando está activo) pero más chicos, para marcar que es un filtro
secundario, no navegación principal.

### B. Lógica de filtro (`js/admin/productos.js`)
Los botones son toggles combinables (se puede activar más de uno a la
vez), no un select de una sola opción — así se puede pedir, por ejemplo,
"disponible + agotado" juntos. Ninguno activo muestra todo (estado por
defecto, nada raro al entrar). `filtrarLista()`, que ya existía para el
buscador de texto, ahora también chequea el estado de cada fila — una fila
se muestra solo si pasa los dos filtros a la vez. Todo corre sobre lo que
ya está cargado en pantalla, sin consultar Firestore de nuevo.

El filtro de estado se mantiene activo al cambiar de pestaña (categoría o
"★ Destacadas" de la sesión 028), para no tener que reactivarlo cada vez
que el dueño navega el panel.

---

## Decisiones clave

| Decisión | Opción tomada | Alternativa |
|---|---|---|
| Tipo de filtro | Botones toggle combinables | Select de una sola opción |
| Alcance del filtro | Client-side sobre lo ya cargado | Nueva consulta a Firestore por estado |
| Persistencia al cambiar pestaña | Se mantiene activo | Se resetea cada vez |

---

## Archivos tocados

```
Paguina_joyas/
├── admin.html                                          (M) — 3 botones de filtro de estado
├── css/admin.css                                        (M) — .admin-filtros / .admin-filtro
├── js/admin/productos.js                                (M) — toggle de filtros + filtrarLista() combinado
├── spec/features/011-arreglos-pagina/
│   ├── plan.md                                           (M) — Ítem 6 documentado
│   └── tasks.md                                          (M) — Ítem 6 agregado
└── sesiones/sesion-029.md                                (??) NUEVO — este archivo
```

---

## Pendientes

- QA visual del panel: el propietario tiene que entrar con su cuenta de
  Google y probar los filtros — no es automatizable desde acá (login real).
- Sigue sin subir: sesiones 024 a 029 y todos los arreglos acumulados de
  `011-arreglos-pagina` — esperando visto bueno del propietario para el
  push conjunto.

---

## Nota de deploy

**No hubo deploy.** Cambio local, `node --check` sobre el JS tocado, sin
commit.
