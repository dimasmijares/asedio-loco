---
id: WRK-TASK-009
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 0.1.0
created: 2026-09-25
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-004
activates:
  - ARCH-001
  - PROD-JUGAR-001
dependencies:
  - id: WRK-TASK-006
    relation: depends-on
tags:
  - moviles
  - pwa
---

# WRK-TASK-009 — M5: PWA (opcional)

## Objective

Que el juego se pueda «Añadir a pantalla de inicio» y se abra a pantalla completa (en vertical por defecto, sin bloquear el giro), sin tienda de aplicaciones. Es la única forma de tener pantalla completa real en un iPhone.

## File Scope

Propuesto:

- `client/index.html` (enlace al manifiesto, `theme-color`, metas de Apple)
- `client/public/manifest.webmanifest` e icono generado (carpeta nueva; Vite copia `public/` a `dist/client`)
- `wrangler.jsonc` solo si el tipo MIME del manifiesto no sale bien (no hizo falta)
- `tests/tools/make-icons.mjs` (genera los iconos), `tests/e2e/pwa.spec.ts` (en el grupo `basicas` de CI)

Fuera: service worker para jugar sin conexión (el juego necesita la red para las salas).

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| ARCH-001 | Los estáticos los sirve el mismo Worker; comprobar que el manifiesto se sirve con su tipo |
| PROD-JUGAR-001 | Abrir la PWA lleva a la portada; un enlace de sala `#ABCD` sigue funcionando |

- Manifiesto con `display: fullscreen`, `orientation: any` (el vertical es el modo por defecto, pero no se bloquea) y `start_url: /`.
- El icono se genera por código, como el resto de gráficos del juego (sin assets externos).
- Depende de M2 porque fija la orientación y la pantalla completa que M2 introduce. Es opcional: se decide tras probar M2-M4 (WRK-SPEC-004, Open Questions).

## Acceptance Criteria

- [x] Chrome ofrece instalar la aplicación: Chromium no da errores de instalabilidad (`Page.getInstallabilityErrors`). En un Android real, abrirla a pantalla completa y girarla es la prueba A7 de WRK-TASK-040, que solo puede hacer el usuario.
- [x] Metas de Apple (`apple-mobile-web-app-capable`, barra translúcida, icono de 180 px) puestas. Comprobarlo en un iPhone es la prueba A8 de WRK-TASK-040, que solo puede hacer el usuario.
- [x] Un enlace de sala abierto desde la PWA entra en la sala.
- [x] Sin errores en el manifiesto. Lighthouse ya no tiene categoría PWA; se usa la misma comprobación de Chromium (`Page.getAppManifest`).

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | — |
| Integration | E2E que comprueba que `/manifest.webmanifest` responde con JSON válido y el tipo correcto |
| Manual | Instalación en un Android y en un iPhone: no se puede automatizar |

## Evidence

2026-09-28.

- `client/public/manifest.webmanifest`: `display: fullscreen` (con `standalone` de reserva), `orientation: any`, `start_url` y `scope` `/`, colores del HUD (#1d1626) e iconos de 192 y 512 px, uno enmascarable. En `client/index.html`: enlace al manifiesto, `theme-color`, `viewport-fit=cover` y las metas de Apple.
- Iconos dibujados por código (`tests/tools/make-icons.mjs`, canvas en Chromium): un castillo con corona sobre un atardecer de lava; el enmascarable, con todo dentro de la zona segura.
- `tests/e2e/pwa.spec.ts`: el manifiesto responde con JSON de tipo correcto y sus iconos son PNG; `Page.getAppManifest` sin errores y `Page.getInstallabilityErrors` vacío; `/#ABCD` sigue llevando a la sala. En local, 1 de 1; en CI se comprueba contra producción, así que también vale el tipo que pone Cloudflare.
- Sin service worker: fuera del alcance (el juego necesita la red) y Chromium ya no lo exige para instalar.
- Pendiente del usuario: instalarla en un Android y en un iPhone (A7 y A8 de WRK-TASK-040).

