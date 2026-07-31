# Sesión 002 — 2026-07-12

## Resumen
Instalación y configuración de 4 MCPs en OpenCode. Migración a configuración por proyecto. Skills reorganizados.

---

## Temas cubiertos

### 1. Evaluación de MCPs viables
- Context7 descartado: el proyecto no tiene dependencias npm que necesiten docs en vivo
- Evaluados los 4 del GitHub MCP list: Playwright, Firecrawl, GitHub, Sequential Thinking
- Todos compatibles con el stack vanilla del proyecto

### 2. Playwright MCP
- `@playwright/mcp` vía npx
- Chromium headless descargado e instalado (114 MiB, Chrome 149)
- Herramientas: browser_navigate, browser_screenshot, browser_click, etc.
- Sirve para: tomar screenshots automáticos del catálogo, probar responsive, verificar carga

### 3. Firecrawl MCP
- `firecrawl-mcp` vía npx, modo keyless (sin API key)
- Firecrawl scrape y search funcionan gratis con rate-limit por IP
- Sirve para: scraping de proveedores (alternativa a extraer_proveedor.py), búsqueda de info

### 4. Sequential Thinking MCP
- `@modelcontextprotocol/server-sequential-thinking` vía npx
- Herramienta: `sequentialthinking` — razonamiento paso a paso con revisión

### 5. GitHub MCP
- Imagen Docker `ghcr.io/github/github-mcp-server` descargada (v1.5.0)
- Autenticación con PAT del git remote (`ghp_...`)
- Sirve para: issues, PRs, Actions, releases desde la terminal
- Scopes detectados: repo, read:org, read:user, workflow, etc.

### 6. MCPs per-project (global → proyecto)
- Inicialmente configurados en `~/.config/opencode/opencode.json` (global)
- Migrados a `Paguina_joyas/opencode.json` (proyecto) para que solo se activen en Silver Cow
- Global quedó limpio (solo `$schema` y `autoupdate`)
- `opencode.json` agregado a `.gitignore` por seguridad (contiene el token de GitHub)
- AGENTS.md actualizado con referencia al archivo

### 7. Omarchy skill en proyecto
- Agregado `skills.paths` en `Paguina_joyas/opencode.json` apuntando a `~/.local/share/omarchy/default/omarchy-skill`
- Skills son acumulativos (no se pueden desactivar globales), pero queda explícito en el proyecto

### 8. Formato-tareas movido a Cato4
- Skill `formato-tareas` sacado de `~/.config/opencode/skills/` (global)
- Movido a `~/.local/share/opencode/skills/formato-tareas/` (repositorio de skills personalizados)
- Creado `/home/said/Documentos/Cato4/opencode.json` con `skills.paths` apuntando allí
- Solo se activa cuando se abre OpenCode desde Cato4

---

## Decisiones clave

| Decisión | Opción elegida | Alternativa descartada |
|---|---|---|
| GitHub MCP método | Docker (imagen oficial) | Build desde Go (más complejo) |
| Firecrawl auth | Keyless (free tier) | API key (requiere registro) |
| Context7 | No instalar | No tiene utilidad para el proyecto |
| MCPs ubicación | Por proyecto (opencode.json local) | Global (~/.config/opencode/) |
| opencode.json en git | Excluido (.gitignore) | Subirlo (expone token) |
| Skills repo personalizado | `~/.local/share/opencode/skills/` | Dejarlos en global |

---

## Archivos tocados

```
~/.config/opencode/opencode.json      — MCPs eliminados, queda limpio
Paguina_joyas/opencode.json           — creado con 4 MCPs + omarchy skill
Paguina_joyas/.gitignore              — +opencode.json
Paguina_joyas/AGENTS.md               — referencia a opencode.json
Paguina_joyas/documentacion/sesion-002.md — este archivo
~/.config/opencode/skills/            — formato-tareas removido
~/.local/share/opencode/skills/       — creado con formato-tareas
/home/said/Documentos/Cato4/opencode.json — creado con skill path
```

---

## Pendientes para el usuario
- [ ] Opcional: obtener API key gratuita en https://firecrawl.dev para menos rate-limiting
- [ ] Opcional: crear fine-grained PAT en GitHub si el classic PAT llega a expirar
