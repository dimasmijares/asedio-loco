---
id: WRK-TASK-009
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
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

Que el juego se pueda «Añadir a pantalla de inicio» y se abra en horizontal y a pantalla completa, sin tienda de aplicaciones. Es la única forma de tener pantalla completa real en un iPhone.

## File Scope

Propuesto:

- `client/index.html` (enlace al manifiesto, `theme-color`, metas de Apple)
- `client/public/manifest.webmanifest` e icono generado (carpeta nueva; Vite copia `public/` a `dist/client`)
- `wrangler.jsonc` solo si el tipo MIME del manifiesto no sale bien

Fuera: service worker para jugar sin conexión (el juego necesita la red para las salas).

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| ARCH-001 | Los estáticos los sirve el mismo Worker; comprobar que el manifiesto se sirve con su tipo |
| PROD-JUGAR-001 | Abrir la PWA lleva a la portada; un enlace de sala `#ABCD` sigue funcionando |

- Manifiesto con `display: fullscreen`, `orientation: landscape` y `start_url: /`.
- El icono se genera por código, como el resto de gráficos del juego (sin assets externos).
- Depende de M2 porque fija la orientación y la pantalla completa que M2 introduce. Es opcional: se decide tras probar M2-M4 (WRK-SPEC-004, Open Questions).

## Acceptance Criteria

- [ ] Chrome en Android ofrece instalar la aplicación y se abre en horizontal a pantalla completa.
- [ ] En iOS Safari, «Añadir a pantalla de inicio» la abre sin barras del navegador.
- [ ] Un enlace de sala abierto desde la PWA entra en la sala.
- [ ] Lighthouse no marca errores en el manifiesto.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | — |
| Integration | E2E que comprueba que `/manifest.webmanifest` responde con JSON válido y el tipo correcto |
| Manual | Instalación en un Android y en un iPhone: no se puede automatizar |

## Evidence

Pendiente.
