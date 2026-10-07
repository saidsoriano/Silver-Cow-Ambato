# Tareas: MCPs en OpenCode

Re-verificado en la sesión 010 (2026-10-07) con `opencode mcp list`.

- [x] Agregar Playwright MCP a opencode.json
- [x] Instalar Chromium: npx playwright install chromium
- [x] Agregar Firecrawl MCP a opencode.json (con API key) — la key ahora vive en `.env` y se lee con `{env:FIRECRAWL_API_KEY}`
- [x] Agregar Sequential Thinking MCP a opencode.json
- [ ] Descargar imagen Docker de GitHub MCP — **no está descargada**; `docker run` la bajaría bajo demanda (por eso el MCP agotaba los 30s del `mcp list`)
- [~] Agregar GitHub MCP a opencode.json (con token) — configurado, pero el token `ghp_…` estaba **revocado (401)**; en la sesión 010 quedó con `"enabled": false` hasta exportar `GITHUB_PERSONAL_ACCESS_TOKEN` válido
- [x] Mover MCPs de global (~/.config/opencode/) a proyecto — el global solo tiene `image-gen` e `higgsfield`, ajenos a este proyecto
- [x] Agregar opencode.json a .gitignore
- [x] Verificar cada MCP con tools/list — sesión 010: `playwright`, `firecrawl` y `sequential-thinking` **conectan**; `github` deshabilitado
- [x] Documentar MCPs en AGENTS.md
