# Silver Cow Ambato

Catálogo web de joyería de plata 925. Página estática para clientes, administrada por el dueño mediante Google Sheets + GitHub.

## Constitution
- mission → `spec/constitution/mission.md`
- tech-stack → `spec/constitution/tech-stack.md`
- roadmap → `spec/constitution/roadmap.md`

## Features
- `spec/features/001-catalogo-sheets/`
- `spec/features/002-diseno-luxury/`
- `spec/features/003-carrito-whatsapp/`
- `spec/features/004-importador-proveedor/`
- `spec/features/005-mcps-opencode/`

## Comandos
- `.venv/bin/python extraer_proveedor.py {categoria|todas}`
- `git add . && git commit -m "msg" && git push`

## Convenciones rápidas
- Imágenes: `{codigo}.jpg` en su carpeta de categoría
- Códigos: `[P-XX-NNN]`
- Sheets columnas: nombre, precio, codigo, estado, esPedido, img, desc
- Variables CSS: --sapphire, --silver, --gold-accent (#C9A84C), --black-deep
- Tono luxury: evitar "oferta", "descuento barato", "buy now"

## Instrucciones generales
- Una tarea a la vez. Lee la spec primero, luego implementa.
- Registra cada sesión en `sesiones/sesion-NNN.md`.
- Lee `sesiones/` al inicio para contexto de sesiones previas.
