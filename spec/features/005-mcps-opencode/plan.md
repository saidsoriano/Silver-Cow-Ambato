# Plan: MCPs en OpenCode

## Enfoque técnico
Configurar `mcpServers` en el `opencode.json` del proyecto. Playwright y Firecrawl se ejecutan via `npx`, GitHub via Docker, Sequential Thinking via `npx`. Todos se verifican con `tools/list` mediante stdio.

## Archivos involucrados
- `opencode.json` — configuración de MCPs del proyecto (excluido de git)
- `~/.config/opencode/opencode.json` — global (sin MCPs, limpio)

## Datos sensibles
- `GITHUB_PERSONAL_ACCESS_TOKEN` — en `opencode.json` (protegido por .gitignore)
- `FIRECRAWL_API_KEY` — en `opencode.json` (protegido por .gitignore)

## Orden de implementación
1. Configurar Playwright MCP (npx + instalar Chromium)
2. Configurar Firecrawl MCP (npx, keyless o con API key)
3. Configurar Sequential Thinking MCP (npx)
4. Configurar GitHub MCP (Docker + token)
5. Migrar de global a proyecto
6. Verificar cada MCP con tools/list
7. Agregar opencode.json a .gitignore
