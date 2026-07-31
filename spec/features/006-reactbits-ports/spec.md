# Feature 006 — Port de componentes ReactBits a vanilla JS

## Objetivo
Portar 4 componentes de ReactBits (https://reactbits.dev) al sitio estático
Silver Cow Ambato (HTML/CSS/JS puro, sin build step), adaptados a la estética
luxury (zafiro/plata/oro).

## Componentes
1. **PixelCard** — tarjeta con efecto de píxeles en hover (canvas + rAF).
2. **CardNav** — navbar flotante con 3 tarjetas expandibles (timeline GSAP).
3. **StaggeredMenu** — menú overlay a pantalla completa con capas escalonadas.
4. **MagicBento** — grid bento con partículas, spotlight, border-glow, tilt,
   magnetismo y ripple al clic.

## Ubicación en el sitio
- PixelCard → envuelve el CTA "Iniciar una adquisición" en `#hero`.
- CardNav → reemplaza `#navbar` (conserva carrito y efecto `scrolled`).
- StaggeredMenu → reemplaza `#mobileMenu` (menú móvil).
- MagicBento → `#filosofia` (6 valores) y `#catalogo` (7 categorías,
  reemplaza `#catFiltros`).

## Restricciones
- Sin React, sin npm, sin build. GSAP v3 vía CDN es la única dependencia externa.
- Colores desde las CSS vars del proyecto (--sapphire, --gold-accent, --silver).
- Textos en español, tono luxury (sin "oferta"/"buy now").
- Respetar `prefers-reduced-motion`.
- MagicBento sin animaciones en móvil (<768px), como el original.
