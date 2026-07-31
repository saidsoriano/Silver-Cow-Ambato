# Especificación: Diseño Luxury

## Historia de usuario
> Como cliente, quiero una página elegante y visualmente atractiva que refleje la exclusividad de la joyería de plata.

## Descripción
Diseño con estética luxury usando paleta de colores sobria (azul zafiro, plata, negro profundo) con acento dorado. Animaciones suaves, tipografía serif para títulos, responsive, y respeto por preferencias de accesibilidad.

## Criterios de aceptación
- [ ] Variables CSS definidas: `--sapphire`, `--silver`, `--gold-accent` (`#C9A84C`), `--black-deep`
- [ ] Hero title con gradiente dorado sutil
- [ ] `::selection` en color dorado
- [ ] Transiciones con `cubic-bezier(.25,.1,.25,1)` para movimiento natural
- [ ] Card hover: imagen escala 1.06 con gold shimmer overlay
- [ ] Filtros de categoría con glow al estar activos
- [ ] Animación count-up: número 925 anima de 0 a target al scrollear
- [ ] `prefers-reduced-motion` desactiva todas las animaciones
- [ ] Fuentes: Cormorant Garamond (títulos) + Montserrat (cuerpo) con `font-display: swap`
- [ ] `<meta name="description">` para SEO
- [ ] Google Fonts precargadas para rendimiento
- [ ] Diseño responsive (móvil, tablet, escritorio)

## Dependencias
- Archivo: `estilos.css` (~1342 líneas)
- Google Fonts: Cormorant Garamond + Montserrat
- No requiere librerías externas
