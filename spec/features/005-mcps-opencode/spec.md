# Especificación: MCPs en OpenCode

## Historia de usuario
> Como desarrollador, quiero tener herramientas de IA conectadas al proyecto para automatizar tareas: screenshots, scraping web, razonamiento estructurado y gestión del repositorio.

## Descripción
Configuración de 4 MCPs (Model Context Protocol) en OpenCode, limitados al proyecto mediante `opencode.json` local. Playwright para navegador headless, Firecrawl para scraping web, Sequential Thinking para razonamiento paso a paso, y GitHub para gestión del repositorio.

## Criterios de aceptación
- [ ] Los 4 MCPs están configurados en `opencode.json` del proyecto
- [ ] No están en el `opencode.json` global (solo se activan en este proyecto)
- [ ] Playwright: puede navegar y tomar screenshots del sitio
- [ ] Firecrawl: puede scrapear URLs y buscar información
- [ ] Sequential Thinking: puede realizar razonamiento estructurado
- [ ] GitHub: puede listar issues, PRs, y gestionar el repo
- [ ] `opencode.json` está en `.gitignore` (protege el token de GitHub)
- [ ] Chromium está instalado para Playwright

## Dependencias
- OpenCode instalado
- Docker instalado (para GitHub MCP)
- Chromium instalado (para Playwright)
- Token de GitHub configurado
- API key de Firecrawl (opcional, modo keyless funciona con límites)
