---
id: ARCH-004
type: spec
layer: architecture
status: active
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
dependencies:
  - id: RULE-004
    relation: constrained-by
  - id: RULE-001
    relation: constrained-by
  - id: ARCH-002
    relation: extends
  - id: DOM-JUEGO-004
    relation: uses-data-from
supersedes: null
tags:
  - fisica
  - rapier
---

# ARCH-004 — Simulación física

## Intent

El juego es derribar castillos: la física tiene que ser creíble, estable en reposo y lo bastante barata para correr en un navegador. Esta especificación fija el motor, el paso de tiempo, cómo se rompen los bloques y cómo se prueba.

## Definition

### Context

- 4 castillos de 140 bloques (560 cuerpos) con uniones, reyes, proyectiles raros (vacas, pianos, imán, agujero negro) y lava.
- Un castillo en reposo no puede derrumbarse solo ni vibrar sin dormirse.
- La física solo corre en el anfitrión (ARCH-002, ARCH-003); los fragmentos sí corren en todos.

### Decision

- **Motor:** Rapier 3D 0.20 (`@dimforge/rapier3d-compat`, WASM), cargado una vez con `loadRapier()`. Gravedad −9,81 y 6 iteraciones del resolvedor.
- **Paso fijo de 1/60 s** (`DT` en `sim.ts`). El bucle de `game.ts` acumula tiempo y da **como mucho 4 pasos por fotograma**. Si llega al tope, descarta el resto: en un equipo lento la física va más despacio en vez de entrar en espiral (D-042). La cámara lenta escala el `dt` de entrada.
- **Rotura por golpes, no por cargas** (D-010). Cada material tiene un `breakForce` (madera 420, piedra 850, cristal 150, hierro 4200; D-017). Por encima de `breakForce` el bloque se rompe. Por encima de `breakForce × CHIP_RATIO` acumula daño. La fuerza de un bloque en reposo que sostiene a otros no cuenta.
- **Uniones fijas rompibles** entre bloques vecinos, sin contacto entre las dos piezas (D-014).
- **Al romperse**, el bloque desaparece de `Sim` y se emite `rm` con pose, velocidad, material, tamaño y semilla. El proyectil que lo rompe atraviesa y conserva el 60 % de la velocidad (D-013).
- **Fractura y fragmentos locales** (D-009). `shared/fracture.ts` trocea el bloque según el material (madera en tiras, piedra en pedruscos, cristal en esquirlas, hierro en planchas). `debris.ts` simula los trozos en un segundo mundo de Rapier propio de cada cliente, con 2 iteraciones. Los bloques reales aparecen ahí como cuerpos cinemáticos. Los trozos viven 3,2-4,8 s. Tope de trozos según calidad: 260, 170 o 90 (ARCH-005).
- **CCD** activada en los proyectiles. Con Rapier 0.20, un cuerpo sin CCD tampoco atraviesa un muro de 8 cm ni a 1000 m/s (D-047); se deja por seguridad.
- **Estabilidad:** suelo de la isla con cuboides y cilindros, no un casco convexo (D-011). No se duermen cuerpos a mano (D-012). Las consultas espaciales primero recogen y luego modifican (D-018).
- **Escenas de física como prueba** (`sim/scenes.ts`, D-048). Una sola definición, ejecutada en Vitest y en el navegador (`/#physics=<escena>`):
  - `ccd`: pedrusco a 140 m/s contra un muro de hierro de 8 cm. No lo atraviesa.
  - `tower`: se quita la base de una torre de 5 bloques y lo de arriba cae.
  - `glass`: el mismo impacto rompe el cristal y no la piedra.
  - `fragments`: un bloque de madera roto genera fragmentos que al rato se retiran.

### Rationale

- Rapier: rápido en WASM, con CCD, uniones y eventos de fuerza de contacto. No hace falta un servidor con física.
- Paso fijo: el mismo resultado a 60 o a 200 fps, y las escenas se reproducen igual en Node.
- Fragmentos locales: no ocupan ancho de banda y no afectan a la partida.

### Consequences

- Los umbrales y las masas se ajustan a mano. Cualquier cambio de física o munición se mide antes y después (RULE-001).
- El resultado no es determinista entre navegadores, así que los clientes no pueden predecir la física.
- Los fragmentos de cada cliente son distintos; no pueden tener efecto en el juego.
- La prueba de CCD confirma que no se atraviesa el muro, no que sea gracias a la CCD.

## Acceptance Criteria

- [x] Las 4 escenas de física pasan en Node (`npm test`) y en el navegador (E2E `fisica`).
- [x] Un paso de física de la escena más cargada cuesta menos de 16 ms incluso sin GPU.
- [ ] El bucle nunca da más de 4 pasos por fotograma (en código, sin prueba automática).
- [ ] Un castillo intacto sigue entero tras 10 s en reposo (se ve en las partidas, pero no hay prueba aislada).
- [ ] La escena `ccd` demuestra que la CCD es necesaria (no lo hace: ver D-047).

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Testing | `tests/unit/physics.test.ts`, `tests/e2e/physics.spec.ts`, `tests/e2e/perf.spec.ts` | 2026-09-26 | low → medium |
| Testing | `tests/balance/destrozo.txt` (destrozo por munición contra un castillo de 140 bloques) | 2026-09-26 | — |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `client/src/game/sim/rapier.ts` | Carga de Rapier |
| Implemented in | `client/src/game/sim/sim.ts` | `Sim`, `DT`, rotura, uniones, CCD, `SimEvent` |
| Implemented in | `client/src/game/game.ts` | Bucle de paso fijo con tope de 4 pasos |
| Implemented in | `client/src/game/sim/debris.ts`, `shared/fracture.ts` | Fragmentos locales y troceo |
| Implemented in | `client/src/game/sim/island.ts` | Suelo de la isla |
| Implemented in | `shared/materials.ts` | `breakForce`, `CHIP_RATIO`, densidad, fricción |
| Implemented in | `client/src/game/sim/scenes.ts` | Escenas `ccd`, `tower`, `glass`, `fragments` |
| Tested by | `tests/unit/physics.test.ts` | Escenas en Node |
| Tested by | `tests/e2e/physics.spec.ts` | Escenas en el navegador, con capturas |
| Tested by | `tests/balance/destrozo.test.ts` | Bloques rotos y desplazados por munición |
| Decided in | D-009 a D-014, D-017, D-018, D-042, D-047, D-048 | Fragmentos, rotura, suelo, sueño, uniones, umbrales, tope de pasos, CCD, escenas |
