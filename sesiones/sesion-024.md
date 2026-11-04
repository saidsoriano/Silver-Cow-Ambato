# Sesión 024 — 010-vista-admin: hotfix de dominio autorizado (2026-11-03)

**Fecha:** 2026-11-03
**Estado:** Cerrada
**Objetivo:** Arreglar el login de Google del panel, que fallaba solo en
producción (en localhost funcionaba desde la sesión 018).

---

## Resumen

Primer uso real de `admin.html` en `saidsoriano.github.io` después del deploy
de la sesión 023: el login de Google fallaba. No se había detectado antes
porque todas las pruebas de login (sesiones 018-023) fueron en `localhost`, que
Firebase autoriza por defecto — el dominio real de producción nunca se agregó.

---

## Temas cubiertos

### Bug: dominio no autorizado para OAuth
Consola del navegador: *"The current domain is not authorized for OAuth
operations... Add your domain (saidsoriano.github.io) to the Authorized
domains list"*. Firebase Authentication exige una lista explícita de dominios
desde los que se puede hacer login con Google — por defecto solo trae
`localhost` y los dominios propios de Firebase (`*.firebaseapp.com`,
`*.web.app`). `saidsoriano.github.io` nunca se agregó porque hasta este
momento nadie había probado el login fuera de `localhost`.

**Arreglo:** Firebase Console → Authentication → Settings → Authorized
domains → agregar `saidsoriano.github.io`. Cambio instantáneo, sin esperar
compilación como los índices de Firestore.

Verificado por el propietario: entra desde la computadora y desde el celular.

---

## Decisiones clave

Ninguna — era una configuración de infraestructura faltante, no una decisión
de diseño.

---

## Archivos tocados

Ninguno en el repo. Cambio de configuración en la consola de Firebase
(`silver-cow-admin` → Authentication → Authorized domains).

---

## Pendientes

Ninguno nuevo. `010-vista-admin` queda cerrada y funcionando en producción,
verificada desde computadora y celular.

---

## Nota de deploy

No aplica — no hubo cambio de código, solo configuración externa.
