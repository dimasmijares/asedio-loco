---
id: WRK-PLAN-002
type: spec
layer: work-plan
scope: ephemeral
status: archived
confidence: high
version: 1.0.0
created: 2026-09-25
updated: 2026-09-26
owner: dimas
parent: WRK-SPEC-002
activates:
  - FEAT-CONTROL-001
  - FEAT-CAMARA-001
  - FEAT-REPLAY-001
  - DOM-JUEGO-004
  - RULE-003
tags:
  - historico
  - control
  - camara
---

# WRK-PLAN-002 — Cambios tras la primera prueba del usuario

## Approach

Seis etapas, cada una desplegada sola: pruebas en local, push a `main`, CI contra producción en verde y revisión con capturas antes de la siguiente.

Orden 1 → 2 → 3 → 4 → 5, y la 6 al final. La 1 y la 2 cambian lo que más se nota al jugar. La 5 es la más cara (física y equilibrio) y convenía hacerla con el control ya cerrado. La 6 (móviles) necesitaba los castillos definitivos para estimar el rendimiento.

No hubo WRK-TASK: este trabajo es anterior a la adopción de KDD y se reconstruye a partir de `PLAN.md`, `DECISIONES.md` y git.

## Estado final

| Orden | Tarea | Estado | Dependencias | Entrega |
|---|---|---|---|---|
| 1 | Ritmo y munición | Hecha | — | 20 s de apuntado, 3 municiones distintas por ronda (D5), elección con 1/2/3 o clic, bots entre las 3, equilibrio medido de nuevo (D-058). `05339aa`, 25-09-2026 |
| 2 | Control nuevo | Hecha | 1 | Clic derecho + ratón con Pointer Lock, Espacio para cargar (D1, D2, D3), rueda para acercar, tutorial y README reescritos (D-059, D-062). `534616f`, `22625fe`, `4de8377` |
| 3 | Cámara panorámica | Hecha | 2 | El director encuadra todo lo que vuela, sin perseguir ni cámara lenta (D-060). `28fc472` |
| 4 | Repetición al caer un rey | Hecha | 3 | Búfer grabado en cada cliente, fase `replay` marcada por el anfitrión (D4, D-061), protocolo v3. `8ad0ab5`, `9b49add` |
| 5 | Castillos más grandes | Hecha | 4 | Escala 1,2, 140 bloques, isla de 68 × 68 m (D6, D-063), protocolo v4. `af03fd5`, `6004903`, `63117c8` |
| 6 | Estudio para móviles | Hecha | 5 | `docs/MOVILES.md`: viabilidad, opciones y plan M1-M5. `6757e9c` |

## Architecture Impact

| Area | Impact | Spec affected |
|------|--------|---------------|
| Estado de partida | Fase nueva `replay` en `MatchState`; versión en el estado del anfitrión (D-064) | ARCH-003 |
| Vista | `replay.ts` graba poses a 30 Hz y eventos de 15 s en cada cliente | ARCH-002 |
| Física | ~30 % más de coste por paso: de 3,3 a unos 5 ms en `/#bench` | ARCH-005 |
| Protocolo | v3 (etapa 4) y v4 (etapa 5) | ARCH-003 |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Pointer Lock da saltos falsos o no llega en pruebas | high | medium | Se materializó: salvaguardas de D-062 y `?nolock=1` en las pruebas |
| Castillos mayores alargan la partida o rompen el rendimiento | medium | high | Destrozo, equilibrio y banco antes y después (RULE-001): 9,6 rondas en normal y más de 190 fps |
| Con más destrozo, las pruebas de red fallan por reyes que aún ruedan | medium | medium | Se materializó: una ronda que acaba antes de converger no se evalúa (`63117c8`) |

## Dependencies

- Decisiones D1-D6 del usuario — dimas — antes de la etapa 1 (hecho el 25-09-2026).

## Evidence

- Commits de la tabla, todos del 25-09-2026 (`git log`).
- Pruebas añadidas: E2E de control en `tests/e2e/controls.spec.ts` (clic derecho + Espacio), entrada y salida de `replay` en la E2E de 4 jugadores, unitarios del búfer en `tests/unit/replay.test.ts` y del reparto de 3 en `tests/unit/match.test.ts`.
- Medidas: `tests/balance/destrozo.txt` (de 7,9 a 8,8 bloques por disparo) y la tabla de rendimiento de `CLAUDE.md` del 25-09-2026.
- `PLAN.md` marca las 6 etapas como hechas.
