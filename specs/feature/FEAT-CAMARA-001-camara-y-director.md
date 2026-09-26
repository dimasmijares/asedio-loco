---
id: FEAT-CAMARA-001
type: spec
layer: feature
status: active
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
dependencies:
  - id: PROD-JUGAR-001
    relation: implements
  - id: DOM-JUEGO-001
    relation: constrained-by
  - id: DOM-JUEGO-004
    relation: uses-data-from
  - id: ARCH-002
    relation: constrained-by
  - id: FEAT-CONTROL-001
    relation: uses-data-from
supersedes: null
tags:
  - camara
  - director
  - panoramica
---

# FEAT-CAMARA-001 — Cámara y director

## Intent

La cámara tiene que dejar apuntar con comodidad y, durante los disparos, enseñar lo que pasa sin marear. La primera versión saltaba de un proyectil a otro y el usuario la describió como «cosas raras». Esta especificación fija los planos de cada fase.

## Definition

### Purpose

Elegir en cada fotograma dónde está la cámara y hacia dónde mira, con transiciones suaves (`CameraRig`) y un director que encuadra los impactos (`Director`).

### Inputs

| Input | Type | Required | Notes |
|---|---|---|---|
| Fase de la partida | `MatchState.phase` | Sí | `aim`, `impact`, `replay`, `results`, `over`… |
| Puntería propia | `Aim.yaw` | En `aim` | FEAT-CONTROL-001 |
| Proyectiles en vuelo | `WorldView.projs` | En impacto | Posiciones interpoladas o locales |
| Rueda | Ratón | No | `userZoom` ×(1 ± 0,08) por paso, entre 0,45 y 1,8 |
| Clic derecho + arrastre | Ratón | No | Solo cuando no se puede apuntar: gira la órbita |
| Sacudida | `view.shake` | No | Explosiones y reyes que caen; tope 1,5, baja 2,2/s |

### Behavior

1. **Apuntado** (`rig.aim`), jugador vivo en fase `aim`:
   - 12 m detrás de la catapulta (×zoom), 3 m a la derecha y 8 m arriba (×zoom).
   - Mira a un punto 22 m por delante y 3,5 m arriba, para que quepa la parábola que crece al cargar.
2. **Impacto y resultados:** manda el director mientras tenga algo que encuadrar.
   - Encuadra a la vez todo lo que vuela y los puntos de impacto de los últimos 2,2 s. No persigue a ningún proyectil.
   - Ignora lo que está bajo y = −2 o a más de 6 m fuera del borde de la isla (`islandSdf`).
   - Radio del encuadre: el que ocupa la acción + 4 m, entre 9 y 24 m.
   - Se abre deprisa (hasta `dt·3` por fotograma) y se cierra despacio (0,6 veces el suavizado del centro). El centro se suaviza con `1 − e^(−1,4·dt)`.
   - Mira desde el lado donde estaba la cámara al empezar el impacto (detrás de tu castillo), fijo toda la ronda.
   - Distancia `radio / tan(27,5°) · 0,8 + 4`; altura al menos 9 m. Suavizado de la cámara 1,6.
   - Tras el último punto sigue 1,2 s más antes de soltar la cámara.
3. **Sin cámara lenta en directo** (D-060): `timeScale` se queda en 1. La cámara lenta es de la repetición (FEAT-REPLAY-001).
4. **Resto de fases:** órbita general alrededor del centro (radio 57 m, altura 34 m, 0,06 rad/s). En `over`, órbita cerrada sobre el castillo ganador (radio 18 m, altura 11 m).
5. La cámara nunca baja de y = 0,8 m.

### Outputs

| Output | Type | Notes |
|---|---|---|
| Posición y objetivo de la cámara | `THREE.PerspectiveCamera` | FOV 55° |
| Ángulo de la cámara | número | El HUD lo usa para girar la flecha del viento |
| Posición de escucha | `sfx.camera` | Volumen y panorámica del sonido |

### Known Limitations

- Pensado para ratón: en táctil no hay zoom ni giro de la órbita.
- El director no sabe dónde va a caer un disparo; lo encuadra a medida que vuela.
- Quedan en `CameraRig` el modo `follow` y el campo `slowmo`, sin uso desde D-060.

## Acceptance Criteria

- [ ] En `aim`, la cámara queda detrás de la catapulta propia y gira con el rumbo.
- [ ] Durante el impacto, el radio del encuadre queda siempre entre 9 y 24 m.
- [ ] Un proyectil que sale de la isla no aleja la cámara.
- [ ] Sin cámara lenta durante la fase de impacto: `Game.timeScale` vale 1 en toda la partida (hoy solo se ve en el código).
- [ ] La rueda no deja el zoom fuera de 0,45-1,8.

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Expert review | Capturas de `tests/tools/impact-shots.mjs` revisadas a ojo en la etapa 3 | 2026-09-25 | low → medium |
| External source | `PLAN.md` etapa 3 | 2026-09-25 | Define el comportamiento esperado |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `client/src/game/camera.ts` | `CameraRig`: modos `orbit`, `aim`, `watch`, zoom y sacudida |
| Implemented in | `client/src/game/director.ts` | Panorámica del impacto |
| Implemented in | `client/src/game/match/ui.ts` | Elección de plano por fase |
| Implemented in | `client/src/game/game.ts` | Rueda → `rig.zoom` |
| Tested by | `tests/tools/impact-shots.mjs` | Capturas de la panorámica (revisión manual) |
| Tested by | `tests/e2e/solo.spec.ts`, `tests/e2e/multiplayer.spec.ts` | Partidas completas sin errores |
| Decided in | D-059, D-060 | Cámara de apuntado más atrás; panorámica sin cámara lenta |

## Open Questions

- ¿Lo ha validado el usuario jugando tras la etapa 3? No consta en `PLAN.md` ni en `DECISIONES.md`. — dimas
- ¿Se borran `CameraRig.follow` y `slowmo`? — dimas
