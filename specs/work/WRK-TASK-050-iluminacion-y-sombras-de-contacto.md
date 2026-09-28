---
id: WRK-TASK-050
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 0.1.0
created: 2026-09-27
updated: 2026-09-27
owner: dimas
parent: WRK-PLAN-010
activates: [FEAT-SENSACION-001, ARCH-005, RULE-004]
dependencies:
  - id: WRK-TASK-052
    relation: depends-on
tags: [graficos]
---

# WRK-TASK-050 — Iluminación del atardecer y sombras de contacto

## Objective

Dar más volumen a los castillos: mejor luz de atardecer, sombras de contacto (oclusión ambiental aproximada) en la base de bloques y castillos, y un contraste más claro entre materiales.

## File Scope

- `client/src/game/render/stage.ts` (luces, sombras)
- `client/src/game/render/materials.ts` (sombreador de los bloques)
- `client/src/game/view.ts` (corrección de WRK-TASK-041: la columna del escudo de tu propio rey)

## Implementation Notes

**Decisión del usuario al empezar** (con capturas de las alternativas): intensidad del cambio y si se aplica también en calidad baja. Opciones técnicas: oclusión aproximada por altura en el sombreador (barata), sombras más suaves, o postproceso SSAO (caro, solo en calidad alta).

**Decisión del usuario (2026-09-27):** oclusión aproximada por altura y luz de atardecer algo más cálida, sutil y en todas las calidades (sin SSAO); las capturas antes y después siguen pendientes de su aprobación.

## Acceptance Criteria

- [x] Capturas antes y después en PC y en móvil vertical. Están publicadas para su aprobación; la aprobación del usuario pasa a WRK-TASK-053, porque no estaba cuando se terminó.
- [x] Calidad baja sin coste apreciable; `perf.spec.ts` y el banco dentro del presupuesto.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Capturas | Escena fija con semilla |
| E2E | `perf` |

## Evidence

2026-09-28. Decisión del usuario: sutil y en todas las calidades, sin SSAO.

- Oclusión aproximada en el sombreador de los bloques (`AO_APPLY` en `withNearFade`): la parte baja de cada bloque (coordenada local) baja al 80 % y lo que está a ras de suelo (altura en el mundo, 0-1,6 m), al 78 %. Sin texturas ni pasadas nuevas.
- Luz: hemisférica de 1,35 a 1,2 (`#cfe4ff` / `#ff9150`); sol de `#fff1d6` a 2,4 → `#ffe2b4` a 2,65, más bajo (−40, 52, 28).
- Capturas con GPU (`seed=21`, HUD oculto) en 1280×720 y 390×844, calidades alta y baja, antes y después, con recortes ampliados. Publicadas en la página «Luz del atardecer»: https://claude.ai/artifact/JM86XSLBDrPBxPsUvzoFYB.
- Coste: banco `low gpu cpu=4 movil`, 20-21 fps, 8,0-8,1 ms de dibujo y 242 llamadas de dibujo (las mismas). PC en calidad media, 290 fps (324 en la medida anterior, dentro del ruido del banco). `perf.spec.ts` y `npm run verify` en verde.
- Hallazgo de WRK-TASK-041, corregido aquí: al apuntar, la columna del escudo real de tu propio rey, junto a la cámara, tapaba media pantalla. Ahora la columna se oculta si el rey está a menos de 16 m de la cámara; el halo se sigue viendo.

