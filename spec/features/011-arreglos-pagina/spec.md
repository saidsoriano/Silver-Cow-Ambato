# Especificación: Arreglos de la página

## Historia de usuario
> Como propietario de Silver Cow Ambato, quiero ir corrigiendo y agregando
> cosas chicas a la página pública a medida que las voy notando — huecos,
> detalles que se ven feos, ajustes puntuales — sin que cada una necesite ser
> todo un proyecto aparte.

## Qué es esta feature
No es un rediseño (eso es `008-rediseno-premium`) ni una pieza grande nueva
(eso es `010-vista-admin`). Es la carpeta donde viven los arreglos chicos y
sueltos del sitio público (`index.html`, `estilos.css`, `catalogo_motor.js`,
etc.) — cosas que el propietario va señalando con una captura y un "esto se ve
feo, arreglalo".

## Cómo funciona
No hay una lista cerrada de criterios de aceptación como en las otras
features, porque el alcance se va definiendo pedido por pedido. Cada ítem:

1. Se diagnostica contra el código real (nunca se asume la causa).
2. Se arregla de la forma más chica y segura posible.
3. Se verifica en localhost (captura o navegador real) antes de pedir visto bueno.
4. Se registra en `tasks.md` de esta misma carpeta, con el ítem siguiente
   numerado, y en la sesión correspondiente.

Misma regla de oro que el resto del proyecto: nada se sube sin que el
propietario lo vea en localhost y apruebe.

## Explícitamente fuera de alcance
- Cambios de dirección visual completos (paleta, tipografía, estructura de
  secciones) — eso es `008-rediseno-premium`.
- Cualquier cosa que toque el panel de administración — eso es
  `010-vista-admin`.
- Arreglos grandes que requieran su propio documento de diseño: si un ítem
  pedido resulta ser grande, se discute aparte si merece su propia feature.

## Criterios de éxito
Cada ítem se considera cerrado cuando el propietario lo ve en localhost y da
el visto bueno — no hay un criterio único para "la feature completa", porque
es una lista viva.
