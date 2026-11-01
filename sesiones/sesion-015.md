# Sesión 015 — Arreglo de accesibilidad: contraste y foco de teclado (2026-10-30)

**Fecha:** 2026-10-30
**Estado:** Cerrada

**Objetivo:** Corregir los dos defectos reales de accesibilidad que la sesión 014
detectó en producción, sin tocar el diseño que el propietario decidió conservar.

---

## Resumen

Dos arreglos quirúrgicos en `estilos.css`, 21 líneas en total. Ningún cambio de
identidad visual, estructura ni texto. Ambos verificados midiendo en un navegador
real, antes y después.

---

## Temas cubiertos

### A. Contraste de texto por debajo del mínimo (bug D de la sesión 014)

El token `--sapphire-light` (`#2a4fa0`) se usaba como **color de texto** en 5 reglas.
Medido contra los tres fondos del sitio:

| Fondo | Antes | Mínimo WCAG AA |
|---|---|---|
| `--black-deep` `#060C1A` | **2.53 : 1** | 4.5 : 1 |
| `--surface` `#0a1628` | **2.35 : 1** | 4.5 : 1 |
| `--sapphire` `#0F2557` | **1.92 : 1** | 4.5 : 1 |

El caso más extendido era `.joya-material` — el texto "Plata Ley 925" que aparece en
**cada una de las tarjetas del catálogo**.

**Solución:** cambiar esas 5 reglas a `--text-muted` (`#8899BB`), que **ya existía en
la paleta** y ya se usaba en 22 sitios como color de texto secundario. No se inventó
ningún color nuevo.

Reglas cambiadas: `.carrito-envio label`, `.carrito-cupon label`, `.founders-label`,
`.joya-material`, `.contacto-card-label`.

**No se tocaron** los tres usos de `--sapphire-light` que no son texto: el pulgar de
la barra de scroll, el borde de `.envio-opt.activo` y el punto decorativo `.ley-dot`.

### B. Sin foco visible para navegación por teclado

Antes había **una sola** regla `:focus-visible` en todo el sitio
(`.carousel-arrow`, en `reactbits.css`). El menú, los botones, los filtros de
categoría y los "Agregar" no marcaban dónde estaba parado quien navega con Tab.

**Solución:** una regla global en `estilos.css`, reutilizando el mismo trazo dorado
que ya usaba el carrusel:

```css
a:focus-visible, button:focus-visible, input:focus-visible,
select:focus-visible, textarea:focus-visible, [tabindex]:focus-visible {
  outline: 2px solid var(--gold-accent);
  outline-offset: 3px;
  border-radius: 2px;
}
```

Al ser `:focus-visible` y no `:focus`, **no aparece al hacer clic con el mouse**,
solo al navegar con teclado.

---

## Verificación (navegador real, sin Playwright)

Medido con Chromium por CDP (ver receta de `CHROME_PATH` en [[01-Estado-Actual]]).

**Contraste, después del cambio:**

| Elemento | Después | |
|---|---|---|
| `.joya-material` ("Plata Ley 925") | **5.15 : 1** | pasa |
| `.contacto-card-label` | **5.15 : 1** | pasa |
| `.carrito-envio label` | **6.32 : 1** | pasa |
| `.carrito-cupon label` | **6.32 : 1** | pasa |

**Foco:** cuatro pulsaciones de Tab seguidas; en las cuatro el elemento activo
reportó `outline: solid 2px rgb(201, 168, 76)`. Confirmado también en captura sobre
el botón "Agregar".

**Hallazgo lateral:** `.founders-label` está definido en `estilos.css` pero **no se
usa en `index.html`** — es CSS muerto. No se borró (fuera del alcance de esta sesión).

---

## Decisiones clave

| Decisión | Opción tomada | Alternativa |
|---|---|---|
| Color de reemplazo | `--text-muted`, ya en la paleta | Inventar un azul nuevo más claro |
| Alcance | Solo los 2 defectos de accesibilidad | Arreglar también el desorden tipográfico (bug E) |
| Estilo de foco | Reutilizar el trazo dorado del carrusel | Definir un estilo nuevo |
| `--sapphire-light` en bordes y fondos | Dejarlo intacto | Cambiarlo todo a ciegas |

---

## Archivos tocados

```
estilos.css                                   (M) 5 colores de texto + regla :focus-visible
spec/features/008-rediseno-premium/tasks.md   (M) "Foco visible + aria-*" tachada (15/26)
sesiones/sesion-015.md                        (??) este archivo
```

---

## Pendientes

- **Bug E (desorden tipográfico)**, sin tocar: 23 tamaños de letra distintos, cuerpo
  a 14px, textos bajo 13px y títulos a 3 líneas en móvil.
- Las **11 tareas abiertas** de `008-rediseno-premium`.
- `.founders-label`: CSS muerto, candidato a borrar en una limpieza futura.

---

## Nota de deploy

Publicado en `main`; GitHub Actions despliega a GitHub Pages.
