---
id: RULE-003
type: rule
layer: governance
status: active
confidence: high
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
dependencies: []
tags:
  - proceso
  - ci
  - despliegue
---

# RULE-003 — Cada etapa llega a producción con CI en verde antes de empezar la siguiente

## Rule

Cada etapa o tarea debe cerrarse así, en este orden:

1. `npm test` y `npm run typecheck` en verde en local.
2. Las E2E locales proporcionales al cambio (`npm run e2e -- <archivo> [-g "<prueba>"]`). Si toca la red, las de `multiplayer`.
3. Si cambia algo visible, capturas con `node tests/tools/review.mjs` (o la herramienta de captura que corresponda), revisadas a ojo.
4. Push a `main`. CI compila, despliega y ejecuta las E2E contra producción.
5. CI en verde (`npm run ci:estado -- --wait`) antes de empezar la siguiente etapa.

Una etapa a medias no debe quedarse en producción: si CI falla y no se arregla enseguida, se revierte.

## Scope

Todo cambio que se sube a `main`, porque `main` se despliega solo. Los cambios que solo tocan `specs/` o documentación también pasan por CI, pero no necesitan E2E locales ni capturas.

## Rationale

El usuario juega en la URL pública con amigos: producción tiene que estar siempre jugable. CI tarda unos 4 minutos gracias a los 7 trabajos en paralelo (ADR-011), así que esperar sale barato. Las capturas existen porque varios fallos solo se ven a ojo (cámara, HUD, repetición).

## Enforcement

| Mechanism | Where | Blocking |
|-----------|-------|----------|
| typecheck, `npm test` y build antes de `wrangler deploy` | `.github/workflows/deploy.yml`, trabajo `deploy` | yes |
| E2E contra producción en 7 grupos | mismo workflow, trabajos `e2e (<grupo>)` | no para el despliegue ya hecho; sí para la etapa siguiente |
| `npm run ci:estado -- --wait` | local, al cerrar la tarea | yes, por proceso |
| Revisión de capturas | artefactos `capturas-e2e-<grupo>` y `review.mjs` | no |

## Exceptions

| Exception | Granted by | Recorded in |
|-----------|------------|-------------|
| Fallo de CI ajeno al cambio (runner, red): se relanza, no se revierte | el agente, avisando a dimas | `## Evidence` de la tarea |
| Prueba E2E inestable ya conocida | dimas | `## Evidence` y una tarea para arreglarla |

## Traceability

- `PLAN.md`, «Cómo se despliega cada etapa»; `PROMPT_asedio_loco.md`, secciones 5-7.
- Decisiones: D-006, D-050.
