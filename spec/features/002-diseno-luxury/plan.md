# Plan: Diseño Luxury

## Enfoque técnico
CSS vanilla con variables personalizadas. Sin preprocesadores ni librerías. Las animaciones se hacen con CSS transitions/animations y el count-up con JavaScript vanilla. Todo el estilo está en un solo archivo `estilos.css`.

## Archivos involucrados
- `estilos.css` — todas las variables, estilos, animaciones, media queries
- `index.html` — meta tags, fonts, estructura HTML semántica, count-up JS inline

## Orden de implementación
1. Definir variables CSS de marca
2. Implementar layout general (nav, hero, grid, footer)
3. Implementar animaciones (hover cards, shimmer, count-up)
4. Agregar `prefers-reduced-motion`
5. Optimizar fuentes y SEO
6. Probar responsive
