# Sesión 003 — 2026-07-12

## Resumen
Reestructuración SDD del proyecto: `documentacion/` renombrado a `sesiones/`, creación de `spec/` con constitution + features existentes, AGENTS.md reducido a entry point.

---

## Temas cubiertos

### 1. Adopción de SDD (Spec-Driven Development)
Basado en el contenido del curso "Desarrollo con IA — Día 3". El proyecto ahora sigue la metodología SDD nivel spec-anchored: la spec se mantiene viva y se actualiza con cada feature, pero el código se edita directamente.

### 2. documentacion/ → sesiones/
- Renombrado para separar el histórico narrativo de la documentación técnica viva (`spec/`).

### 3. spec/constitution/ creado
- `mission.md` — identidad, audiencia, tono luxury, objetivos, alcance
- `tech-stack.md` — stack completo: lenguajes, hosting, MCPs, skills, proveedores
- `roadmap.md` — features implementadas, planeadas (cambio-proveedor, vista-admin), descartadas

### 4. spec/features/ creado
- `001-catalogo-sheets/` — Google Sheets + Apps Script + caché
- `002-diseno-luxury/` — paleta gold accent, animaciones, responsive
- `003-carrito-whatsapp/` — carrito client-side + envío WhatsApp + cupones
- `004-importador-proveedor/` — scraper ItalSteel Odoo
- `005-mcps-opencode/` — MCPs del proyecto
- Cada feature tiene spec.md (criterios de aceptación), plan.md (enfoque técnico), tasks.md (checklist)

### 5. AGENTS.md reducido
- Pasó de 63 líneas a ~25 líneas
- Ahora es un entry point que lista constitution, features, comandos, convenciones y apunta a `spec/` y `sesiones/`

### 6. Plantilla SDD genérica creada
- En `/home/said/Documentos/Plantilla proyectos/`
- 11 archivos: AGENTS.md, spec/constitution/*, spec/features/000-ejemplo/*, sesiones/sesion-001.md, guia-mcps.md, guia-inicio-rapido-html.md, README.md
- Basada en los 3 días del curso

---

## Decisiones clave

| Decisión | Opción elegida | Alternativa descartada |
|---|---|---|
| Nivel SDD | Spec-anchored (spec viva, código editable) | Spec-first (spec solo al inicio) |
| Nombre carpeta | `sesiones/` | `documentacion/` |
| AGENTS.md | Entry point ~25 líneas | Contenido completo ~63 líneas |

---

## Archivos tocados

```
documentacion/ → sesiones/               (renombrado)
AGENTS.md                                (reducido a entry point)
spec/constitution/mission.md             (creado)
spec/constitution/tech-stack.md          (creado)
spec/constitution/roadmap.md             (creado)
spec/features/001-catalogo-sheets/       (creado: spec, plan, tasks)
spec/features/002-diseno-luxury/         (creado: spec, plan, tasks)
spec/features/003-carrito-whatsapp/      (creado: spec, plan, tasks)
spec/features/004-importador-proveedor/  (creado: spec, plan, tasks)
spec/features/005-mcps-opencode/         (creado: spec, plan, tasks)
sesiones/sesion-003.md                   (este archivo)
```

---

## Pendientes
- [ ] Continuar con features futuras cuando toque (cambio-proveedor, vista-admin)
