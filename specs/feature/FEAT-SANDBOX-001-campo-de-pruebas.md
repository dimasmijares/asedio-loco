---
id: FEAT-SANDBOX-001
type: spec
layer: feature
status: active
confidence: medium
version: 1.0.1
created: 2026-09-26
updated: 2026-09-26
owner: dimas
dependencies:
  - id: FEAT-CONTROL-001
    relation: uses-data-from
  - id: FEAT-CAMARA-001
    relation: uses-data-from
  - id: DOM-JUEGO-003
    relation: uses-data-from
  - id: ARCH-004
    relation: constrained-by
  - id: RULE-004
    relation: constrained-by
supersedes: null
tags:
  - sandbox
  - pruebas
  - fisica
  - rendimiento
---

# FEAT-SANDBOX-001 — Campo de pruebas, escenas de física y banco

## Intent

Hace falta un sitio donde probar cada munición sin partida, y escenas fijas para comprobar la física y medir el rendimiento. Esta especificación fija las tres rutas que no son partida: `/#sandbox`, `/#physics=<escena>` y `/#bench`.

## Definition

### Purpose

- `/#sandbox`: tu catapulta contra un castillo diana, con las 12 municiones sin límite. Se llega también desde «Jugar solo» → «Campo de pruebas».
- `/#physics=ccd|tower|glass|fragments`: escenas de física con resultado `ok` o no.
- `/#bench`: la escena más cargada, que mide fps y coste de la física.

### Inputs

| Input | Type | Required | Notes |
|---|---|---|---|
| Controles de apuntado | FEAT-CONTROL-001 | Sandbox | Clic derecho, Espacio, A/D, W/S, Mayús, rueda |
| 1…9, 0, −, = (también en el teclado numérico) | Teclado | Sandbox | Las 12 municiones en orden de `AMMO_IDS` (o clic en la tarjeta) |
| T / C | Teclado | Sandbox | Reconstruir los castillos / cámara libre (órbita sobre la diana) |
| `physics.run()` | Gancho de prueba | Escenas | Lanza la escena tras la captura «antes» |
| `?quality=` | URL | Banco | Fija la calidad; sin él, la guardada |

### Behavior

1. **Campo de pruebas** (`SandboxMode`):
   - Tu castillo en el hueco 2 y la diana en el 1, sin rondas, sin tiempo y sin viento.
   - Cada disparo sale al soltar Espacio y se puede seguir disparando.
   - La cámara usa el director durante los impactos y la de apuntado el resto del tiempo.
   - El marcador enseña los bloques de ambos castillos. Las estadísticas (fps, ms, bloques, trozos, partículas) se ven siempre.
   - Si cae el rey diana sale el rótulo con la causa. `aimAt('king'|'wall'|'tower')` apunta con precisión para las capturas.
2. **Escenas de física** (`scenes.ts`, una sola definición para el navegador y para Vitest, D-048):
   - `ccd`: un pedrusco a 140 m/s no atraviesa un muro de 8 cm.
   - `tower`: una torre sin base se derrumba.
   - `glass`: con el mismo impacto el cristal se rompe y la piedra no.
   - `fragments`: un bloque roto da fragmentos que luego se retiran.
   - Cada escena cuenta en tiempo de simulación y acaba en `done` con `{ok, detail}`.
3. **Banco** (`BenchMode`): los 4 castillos enteros (560 bloques).
   - Tras 1,5 s de calentamiento lanza 12 proyectiles cruzados, cada 0,12 s, contra los reyes: vacas, pedruscos, agujero negro, piano, sandía, tronco, imán, cocos, bola de nieve y gallina.
   - Mide 9 s de simulación (D-051) y devuelve fps medios, peor 5 %, CPU por fotograma, física por paso, llamadas de dibujo, triángulos, cuerpos despiertos, fragmentos y partículas.

### Outputs

| Output | Type | Notes |
|---|---|---|
| `__asedio.game`, `__asedio.mode` | Ganchos | Sandbox |
| `__asedio.physics.{phase, result}` | Ganchos | Escenas |
| `__asedio.bench.{phase, result}` | Ganchos | Banco; `tests/tools/bench.mjs` lo imprime |

### Known Limitations

- La escena `ccd` pasa también sin CCD: Rapier 0.20 no deja atravesar el muro ni a 1000 m/s (D-047). La prueba confirma que no se atraviesa, no que sea gracias a la CCD.
- El rendimiento solo se ha medido con una RTX 3080 y con SwiftShader, nunca en una gráfica integrada.
- En el campo de pruebas no hay Q/E (solo hay una diana) ni viento.

## Acceptance Criteria

- [x] `/#sandbox` carga sin errores con 2 castillos enteros y 2 reyes.
- [x] Las 4 escenas de física terminan con `ok` en Node y en el navegador.
- [x] En `/#bench`, más de 200 cuerpos despiertos y cada paso de física por debajo de 16 ms, incluso con SwiftShader.
- [ ] Con GPU, calidad media, al menos 60 fps medios en el banco (se mide a mano con `tests/tools/bench.mjs`; última medida: 220 fps).

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Testing | `tests/unit/physics.test.ts`, `tests/e2e/physics.spec.ts`, `tests/e2e/smoke.spec.ts`, `tests/e2e/perf.spec.ts` | 2026-09-26 | low → medium |
| Production data | Tabla de rendimiento de CLAUDE.md, RTX 3080 | 2026-09-25 | — |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `client/src/game/modes/sandbox.ts` | Campo de pruebas |
| Implemented in | `client/src/game/modes/physicsTest.ts` | Escenas en el navegador |
| Implemented in | `client/src/game/sim/scenes.ts` | Definición de las 4 escenas |
| Implemented in | `client/src/game/modes/bench.ts` | Banco de rendimiento |
| Implemented in | `client/src/main.ts` | Rutas `#sandbox`, `#physics=`, `#bench` |
| Tested by | `tests/unit/physics.test.ts` | Escenas en Node |
| Tested by | `tests/e2e/physics.spec.ts` | Escenas con capturas |
| Tested by | `tests/e2e/smoke.spec.ts` | Campo de pruebas sin errores |
| Tested by | `tests/e2e/perf.spec.ts` | Presupuesto de la física |
| Tested by | `tests/tools/bench.mjs`, `tests/tools/sandbox-shot.mjs` | Banco con GPU y capturas por munición |
| Decided in | D-047, D-048, D-051 | CCD, escenas en Node, duración en tiempo de simulación |

## Open Questions

