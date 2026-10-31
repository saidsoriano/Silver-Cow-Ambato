# Sesión 014 — Rediseño visual explorado y descartado (2026-10-29 / 30)

**Fecha:** 2026-10-29 (continúa al 2026-10-30)
**Estado:** Cerrada — **todo el trabajo visual fue revertido a pedido del propietario**
**Objetivo:** Rediseñar la página completa partiendo del estado publicado, en local,
sin subir nada hasta tener visto bueno.

> Resultado: el propietario revisó el rediseño por partes y decidió **quedarse con la
> versión que ya estaba en git**. El árbol se revirtió al commit `c351739`. Esta
> sesión no cambió ni una línea del sitio; su valor es el registro de **qué se probó
> y por qué se descartó**, para no repetirlo.

---

## Resumen

Se auditó el sitio publicado con un inspector visual, se sorteó una dirección de
diseño ("dark room"), y se construyó la Fase 1 en local: escala tipográfica de 5
pasos, hero plano sin degradados, corrección de contrastes y una banda de garantía
nueva. Se portaron tres componentes de ReactBits. El propietario rechazó la banda de
garantía en tres iteraciones sucesivas y finalmente pidió conservar la versión ya
publicada. Todo quedó guardado en un stash, nada se subió.

---

## Temas cubiertos

### A. Herramienta de QA visual — Playwright sigue sin estar, pero hay sustituto
`AGENTS.md` ya declara (desde la sesión 013) que el MCP de Playwright no está
disponible. En esta sesión se encontró que **sí se puede hacer verificación visual
automatizada** sin ese MCP: existe un binario de Chromium en disco y las
herramientas del skill `taste-skill` lo manejan por CDP.

```
CHROME_PATH="/home/said/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome"
```

Con esa variable se pueden tomar capturas a varios anchos, medir contraste, tamaños
de tipografía, huecos en blanco y desbordes. **Es la primera vez en el proyecto que
la QA visual no depende de que el dueño abra el navegador.** Vale conservarlo.

### B. Auditoría visual de partida
Sobre el sitio publicado: **19 FAIL, 7 WARN**. Los más graves:
- Contraste ilegible: `--sapphire-light` (`#2a4fa0`) sobre fondo oscuro da **2.5:1**
  (el mínimo es 4.5:1). Afectaba "Plata Ley 925" en las tarjetas, etiquetas del
  carrito, contacto y fundadores.
- **23 tamaños de tipografía distintos** en una misma página (lo sano son ~5).
- Títulos que se parten en 3 líneas en móvil y tablet.
- 21 degradados, sombras en reposo, 27 cajas con borde de 1px, textos bajo 13px.

> **Estos defectos siguen en producción**, porque el rediseño se descartó. Ver
> Pendientes.

### C. Dirección sorteada: "dark room"
De tres opciones se eligió *dark room* (sala oscura, piezas como objetos iluminados)
porque conecta con la filosofía ya escrita en el propio sitio: *"no está en ninguna
vitrina — no la tiene nadie más"*.

**Se conservó la identidad de marca a propósito:** la dirección proponía paleta
carbón+salvia y tipografía Clash Grotesk; se mantuvieron zafiro+plata+oro y
Cormorant+Montserrat, porque la marca está fijada desde la sesión 001 y la tipografía
externa chocaba con la regla de usar solo Google Fonts.

### D. Fase 1 construida (y luego revertida)
- Escala de 5 pasos (`--step-display` … `--step-small`) y tokens `--room-*`.
- Hero: se quitaron el sello tipo píldora, el piso de rejilla, los degradados de
  fondo, el texto en degradado y el destello del botón. Título a 2 líneas.
- Contraste corregido en los 4 puntos del punto B.
- Fila de confianza rehecha.

Bajó de **19 FAIL a 13**. Los 13 restantes eran de secciones no tocadas (filosofía,
proceso, contacto, catálogo).

### E. Ports de ReactBits
El propietario aportó **https://reactbits.dev** como fuente de componentes.

| Componente | Resultado |
|---|---|
| **Magnet** | **Descartado por bug.** Los botones del hero se montaban uno sobre otro. Causa: el hueco entre ambos es de **16px** y el imán los desplaza más que eso. Se intentó arreglar con exclusividad (que solo reaccione el más cercano) y se verificó con cursor real, pero el propietario pidió quitarlo. |
| **Click Spark** | Portado a vanilla, chispa dorada al hacer clic. Funcionaba. Descartado con el resto. |
| **Animated Content** | Portado a vanilla (el original usa GSAP + ScrollTrigger, que el sitio no carga) con IntersectionObserver y transiciones CSS. Entrada escalonada. Descartado con el resto. |

### F. Banda de garantía — tres iteraciones, todas rechazadas
1. **4 celdas planas** con un bloque dorado grande → "se ve vacía".
2. **Partición narrativa** (titular grande + datos en filas de ancho completo) →
   "no se entiende nada": el término y su detalle quedaban tan separados que no se
   sabía cuál iba con cuál.
3. **Término sobre su detalle, en columnas** → tampoco convenció.

En la iteración 2–3 se añadió un dato vivo: la frase mostraba **357 piezas en 7
categorías** leyendo el catálogo real de Sheets en vez de un número escrito a mano.
Funcionaba y confirmó las cifras de `01-Estado-Actual.md`.

### G. Reversión
`git stash push -u` con todo el trabajo. Árbol verificado idéntico a `c351739`
(`git diff HEAD` vacío). El sitio público **nunca cambió** en toda la sesión.

---

## Decisiones clave

| Decisión | Opción tomada | Alternativa |
|---|---|---|
| Alcance | Rediseño completo (no restyle) | Restyle conservando layout |
| Dirección visual | "dark room" | "hero-object", "name-as-monument" |
| Paleta y tipografía | **Conservar** la marca existente | Adoptar la paleta/tipo sorteados |
| Magnet en los botones | **Quitar**, sin reemplazo | Arreglar la colisión / poner otro efecto |
| Resultado final | **Conservar la versión publicada** | Seguir iterando el rediseño |
| Trabajo descartado | Guardado en stash, no borrado | `git checkout .` destructivo |

---

## Archivos tocados

**Ninguno.** El árbol quedó idéntico al commit `c351739`.

Lo construido vive en un stash:

```
stash@{0}: rediseno sesion 014 descartado por el propietario
           (hero plano, banda de garantia, click-spark)
```

Contenía: `estilos.css`, `index.html`, `catalogo_motor.js`, `.gitignore` modificados
y `js/click-spark.js`, `js/trust-band.js` nuevos.

Respaldo previo a la sesión: `backups/backup_pre_rediseno_premium_fase2_2026-10-29.zip`
(64 MB, gitignorado).

Capturas e informes del inspector: fuera del repo, en el scratchpad de la sesión.

---

## Pendientes

**Decisión del propietario:**
- Qué hacer con `stash@{0}`: conservarlo, recuperar partes sueltas (por ejemplo solo
  la corrección de contraste, que es un defecto real) o borrarlo con
  `git stash drop stash@{0}` (irreversible).

**Defectos reales que siguen en producción** (detectados en el punto B, no corregidos
porque el rediseño se descartó):
- Contraste **2.5:1** en textos con `--sapphire-light` sobre fondo oscuro —
  por debajo del mínimo de accesibilidad. Es el más serio.
- Títulos a 3 líneas en móvil (`contacto`, `filosofía`).
- Textos bajo 13px y cuerpo de texto a 14px.
- Hueco en blanco de ~1400px entre secciones, cerca del pie.

**De `008-rediseno-premium`** (sin cambios desde la sesión 013): navbar, ports
restantes, catálogo UX, testimonios, galería, responsive y smoke test.

**Documentación:**
- Añadir a `AGENTS.md` la receta de QA visual con `CHROME_PATH` del punto A.

---

## Nota de deploy

**No hubo deploy ni commit.** La página pública sigue igual que tras la sesión 012.
