# Sesión 009 — Restaurar publicación en GitHub Pages (404 → online)

**Fecha:** 2026-10-01
**Objetivo:** Diagnosticar y restaurar el catálogo en `https://saidsoriano.github.io/Silver-Cow-Ambato/`, que devolvía 404 desde hacía ~2 meses.

## Síntoma

El sitio devolvía **HTTP 404** con el cuerpo `Site not found · GitHub Pages`. El dueño lo reportaba como "la página se cayó".

## Diagnóstico

**No era un error de código.** Evidencia verificada:

- El último deploy fue **2026-07-31 21:47 UTC**, con el job `deploy` en **success** (run `30667739722`).
- Desde ese deploy: **0 pushes, 0 builds, 0 cambios** (HEAD = `07f5e5f4`).
- El repo estaba limpio y sincronizado con `origin/main`.
- El contenido era válido para Jekyll: sin front matter, sin sintaxis Liquid, sin rutas `_`/`.`, `index.html` en la raíz.
- Otro repo del mismo dueño (`pucesa.com`) servía **HTTP 200** → Pages funcionaba bien en su cuenta.
- La cuenta no estaba suspendida ni archivada.

La clave fue que `Site not found` **no es un build roto**: significa que GitHub no tiene ningún sitio publicado en esa dirección. La config de Pages era correcta (`branch: main`, `path: /`, `public: true`) pero `build_type` era **`legacy`**.

### Causa raíz

GitHub retiró el pipeline legacy de Pages (Jekyll "Deploy from a branch"). La config seguía apuntando a ese modelo obsoleto, así que **nadie podía volver a construir**. Se confirmó al intentar `gh run rerun`, que respondió:

> `run 30667739722 cannot be rerun; Unable to retry this workflow run because it was created over a month ago`

Es decir: el sitio llevaba ~2 meses publicado y luego se dismantleó/despublicó al dejar de correr el build legacy. El repositorio y el código nunca dejaron de estar bien.

## Solución

Migración del despliegue al modelo actual de **GitHub Actions**.

### Archivos añadidos

- **`.github/workflows/pages.yml`** — deploy con `actions/configure-pages@v5`, `upload-pages-artifact@v3` y `deploy-pages@v4`. Se dispara en cada push a `main` (igual que el auto-deploy anterior) y tiene `workflow_dispatch` para relanzar builds manualmente.
- **`.nojekyll`** — el sitio es HTML/CSS/JS puro, sin Jekyll. Evita que el build procese archivos innecesariamente.

### Publish explícito

El workflow no publica la raíz del repo tal cual:.stagea en `_site/` **solo** lo que el sitio necesita.

**Publicado:** `index.html`, `catalogo.js`, `catalogo_motor.js`, `estilos.css`, `reactbits.css`, `favicon.ico`, `.nojekyll`, `js/`, `assets/` y las 7 carpetas de producto.

**Excluido a propósito:** `sesiones/`, `spec/`, `csv/`, `backups/`, `AGENTS.md`, `manual-del-conductor.html`, `.git/` (62 MB) y `.gitignore`.

Motivo: el build legacy publicaba la raíz completa, es decir que dejaba accesibles en público los documentos de trabajo del proyecto y el manual del conductor. Se verifica en el workflow que `manual-del-conductor.html` no está enlazado desde `index.html`, por lo que excluirlo no rompe nada.

### Verificación del staging

Antes de subir se comprobó con un script que los 17 recursos referenciados por `index.html` (CSS, JS, logo, una imagen de cada una de las 7 categorías) existen todos en `_site/`: **0 faltantes**. Sin este control, el primer intento omitía `js/` y la página habría salido sin los componentes ReactBits.

## Credenciales

El PAT personal embebido en el remote (`https://ghp_…@github.com/…`) estaba **revocado** (`401 Bad credentials`) y `gh` no tenía sesión. Se rehízo la autenticación con `gh auth login --web` (device flow, scope `repo`) y se limpió el token muerto del remote:

```
https://github.com/saidsoriano/Silver-Cow-Ambato.git
```

El token nunca estuvo commiteado —solo vivía en el `.git/config` local—, pero conviene rotarlo si vuelve a aparecer en otra máquina.

## Nota: Vercel

Hay deploys históricos de **Vercel** en el repo (entornos `Production` y `Preview`, creados por `vercel[bot]`). Su URL de deployment responde con un **login de Vercel**, no con el sitio público. Se dejó intacto y fuera de alcance: el dueño pidió volver a GitHub Pages.

## Estado final

- `has_pages: true`, deploy con `actions/deploy-pages`.
- Verificado **HTTP 200** en `https://saidsoriano.github.io/Silver-Cow-Ambato/` con el `<title>` esperado.
- Build `Deploy Pages` en **success** en GitHub Actions.
- 17/17 recursos del sitio resueltos.

## Pendiente

- Si en el futuro se quiere limpiar del todo, revisar si Vercel sigue conectado al repo y desconectarlo.
- `spec/constitution/tech-stack.md` sigue describiendo el despliegue como "GitHub Pages (auto-deploy en push a main)", lo cual **sigue siendo cierto**, pero ahora vía Actions. Conviene actualizar esa línea la próxima vez que se toque la spec.