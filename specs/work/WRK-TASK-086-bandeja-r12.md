---
id: WRK-TASK-086
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 0.1.0
created: 2026-10-03
updated: 2026-10-03
owner: dimas
parent: WRK-PLAN-011
activates: [FEAT-CONTROL-001, FEAT-INTERFAZ-001]
dependencies:
  - id: WRK-TASK-085
    relation: depends-on
tags: [interfaz, bandeja, movil, punteria]
---

# WRK-TASK-086 — Bandeja: pad más grande y botón más pequeño (R-12)

## Objective

R-12 del usuario (03-10-2026), según `components/BandejaMovil/README.md` del design system: pad de puntería de 252×128 y botón de disparo de 82 px (96 con el anillo de potencia). El recorrido completo de giro y elevación se reparte en todo el pad, así el pad más grande da más precisión. También en modo zurdo.

## File Scope

- `client/src/game/aim.ts` (`PAD_SPAN`, `padMove` con el tamaño del pad), `client/src/ui/hud.ts` (escala `--k`, `bindPad`), `client/src/ui/style.css` (bandeja, botón, pad)
- `tests/e2e/touch.spec.ts`

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-CONTROL-001 | Pad de puntería y botón de disparo de la bandeja |
| FEAT-INTERFAZ-001 | Bandeja del pulgar: ≤ 30 % del alto, espejada en modo zurdo |

- **Medidas a 390×844:** botón de 82 px con un anillo crema oscuro de 4 px y contorno noche (96 en total), pad de 252×128, 14 px a los lados y entre ellos. Para que la bandeja siga en el 30 % (253 px), el margen de arriba baja a 12 px, el hueco hasta las cartas a 10 y el de abajo a 34 (la zona segura del README). La escala `--k` cuenta 7 px fijos y 246 que escalan, y 348 px de ancho (96 + 252): a 360×780 todo queda al 0,913.
- **Recorrido:** `PAD_SPAN` = 0,78 rad de giro de un borde al otro y 0,31 rad de elevación de arriba abajo (lo que recorría el pad de 222×112 con la ganancia del ratón). El arrastre se mide en fracción del pad, así que da igual su tamaño: el pad más grande da más precisión, y el más pequeño de una pantalla estrecha, la misma vuelta con menos detalle.

## Acceptance Criteria

- [x] A 390×844, pad de 252×128 y botón de 82 px (96 con el anillo), en diestro y en zurdo; la bandeja sigue en el 30 % del alto.
- [x] Un arrastre de un borde al otro del pad gira lo mismo que dice `PAD_SPAN`, en diestro y en zurdo.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `tests/e2e/touch.spec.ts` (medidas, recorrido de lado a lado en diestro y zurdo), `hud-compact.spec.ts` (bandeja ≤ 30 % y sin solapes en tres móviles en vertical) |

## Evidence

2026-10-03. A 390×844: bandeja de 253 px, pad 252×128, botón 82 (96 con el anillo), `--k` = 1; a 360×780, `--k` = 0,913. `touch.spec.ts` y `hud-compact.spec.ts` en verde.
