# Sesión 034 — 011-arreglos-pagina: brillo del hero (2026-11-04)

**Fecha:** 2026-11-04
**Estado:** Cerrada — código local, **sin commit/push**
**Objetivo:** El dueño reportó que el hero se ve opaco, pidió que vuelva
el brillo.

---

## Resumen

Diagnóstico con un giro: la hipótesis inicial (el video del anillo vs. el
3D de Three.js compiten y a veces gana el más opaco) se probó, se
implementó, y al verificar con capturas reales resultó estar mal — se
revirtió por completo antes de seguir. La causa real era otra, mucho más
chica: el "negro" del video comprimido no es negro puro, y con
`mix-blend-mode: screen` eso lava el contraste del fondo estrellado
alrededor del anillo. Arreglo final: una línea de CSS (`filter:
contrast(1.6)`), sin tocar nada de la lógica de JavaScript.

---

## Temas cubiertos

### A. Intento 1 (descartado): sacar el video, dejar solo el 3D
El hero tiene dos formas de mostrar el anillo (`js/hero-ring.js`): un
video grabado y un anillo 3D animado con Three.js, en carrera — el que
cargue/reproduzca primero gana y el otro se oculta. La hipótesis fue que
el video (toma fija) se ve más plano que el 3D (luces que se mueven), y
que la queja de "opaco" pasaba cuando el video ganaba la carrera.

Se implementó: sacar el video del todo, dejar el 3D como único
protagonista (`js/hero-ring.js`, `index.html`, `estilos.css`). Al
verificar con capturas reales aparecieron dos datos que tumbaron la
hipótesis entera:
1. El anillo 3D tiene un bug de tamaño/cámara ya existente: sale enorme,
   tapa el título completo. Nunca se notó porque en la práctica el video
   siempre gana.
2. Se repitió la carga 5 veces seguidas contra el servidor local: el
   video ganó las 5 veces. No hay tal carrera variable acá — esa no era
   la causa real de la queja.

Se revirtió todo el intento antes de seguir: `js/hero-ring.js` con `git
checkout` (su diff completo era solo este cambio de hoy, seguro
revertirlo así); `index.html` y `estilos.css` a mano, porque esos dos
archivos tienen además todo el resto del trabajo acumulado de
`011-arreglos-pagina` sin subir — un `git checkout` ahí hubiera borrado
también eso. Se confirmó con `git diff` que las líneas de
`ringVideo`/`has-video` quedaron exactamente como antes de tocar nada.

### B. Causa real, encontrada después
Se extrajo un cuadro del video con `ffmpeg` y se midieron píxeles de
fondo con Python/Pillow: el "negro" del video ronda `rgb(10-20)`, no es
negro puro (típico de la compresión de video). `#ringVideo` usa
`mix-blend-mode: screen` para que el fondo del video se funda con el
fondo del hero — pero `screen` aclara cualquier cosa que no sea
exactamente negro, así que ese gris casi-negro lavaba un poco el campo de
estrellas (`#hero::after`) detrás del video, en toda esa zona.

### C. Arreglo real: una línea de CSS
`estilos.css` — `filter: contrast(1.6)` en `#ringVideo`. El filtro corre
antes del blend, empuja esos grises casi-negros mucho más cerca de 0 (se
funden del todo con `screen`) sin tocar los brillos reales de la joya. No
se tocó la lógica de JavaScript para nada.

---

## Decisiones clave

| Decisión | Opción tomada | Alternativa |
|---|---|---|
| Diagnóstico inicial (video vs 3D) | Descartado al verificar — se revirtió | Insistir o "arreglar" el bug del 3D encontrado de paso |
| Arreglo final | `filter: contrast()` en el video | Cambiar `mix-blend-mode`, o editar el video fuente |
| Revertir `hero-ring.js` | `git checkout` (diff limpio, solo de hoy) | Deshacer a mano |
| Revertir `index.html`/`estilos.css` | A mano, línea por línea | `git checkout` (hubiera borrado trabajo de otras sesiones sin subir) |

---

## Archivos tocados

```
Paguina_joyas/
├── estilos.css                                         (M) — filter: contrast(1.6) en #ringVideo (neto, tras revertir el intento 1)
├── js/hero-ring.js                                       (sin cambios netos — revertido con git checkout)
├── index.html                                            (sin cambios netos — revertido a mano)
├── spec/features/011-arreglos-pagina/
│   ├── plan.md                                           (M) — Ítem 10 documentado, con el intento descartado
│   └── tasks.md                                          (M) — Ítem 10 agregado
└── sesiones/sesion-034.md                                (??) NUEVO — este archivo
```

---

## Pendientes

- Sigue sin subir: sesiones 024 a 034 y todos los arreglos acumulados de
  `011-arreglos-pagina` — esperando visto bueno del dueño para el push
  conjunto.
- Ítem 4 (posible desalineación en el carrusel) sigue esperando que el
  dueño precise qué ve descalzado.
- Queda anotado, sin tocar: el bug real del anillo 3D (sale gigante si
  alguna vez el video no gana la carrera). No es urgente porque el video
  gana siempre en la práctica, pero es una fragilidad latente — si algún
  día se quiere usar el 3D como protagonista, hay que arreglar ese bug
  primero.
- Pendiente de antes, sigue vigente: avisar al dueño cuando esta feature
  se cierre, para retomar lo del Circular Carousel de reactbits.

---

## Nota de deploy

**No hubo deploy.** Cambio local, verificado con navegador headless
(5 cargas repetidas para descartar la carrera, comparación de píxeles
antes/después del arreglo real, captura en celular), sin errores de
consola, sin commit.
