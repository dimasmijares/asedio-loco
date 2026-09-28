---
id: FEAT-SENSACION-001
type: spec
layer: feature
status: active
confidence: medium
version: 1.3.0
created: 2026-09-26
updated: 2026-09-28
owner: dimas
dependencies:
  - id: ARCH-002
    relation: constrained-by
  - id: ARCH-005
    relation: constrained-by
  - id: DOM-JUEGO-001
    relation: uses-data-from
  - id: DOM-JUEGO-003
    relation: uses-data-from
supersedes: null
tags:
  - sonido
  - efectos
  - lava
  - estadisticas
---

# FEAT-SENSACION-001 — Sonido, efectos y estadísticas

## Intent

El juego es de destrozo y de risas: cada golpe tiene que sonar y verse, y al final hay que recordar quién hizo el disparo más ridículo. Esta especificación fija el sonido, las partículas, la lava y las estadísticas finales.

## Definition

### Purpose

Traducir los `SimEvent` (locales o de la red) en sonido y efectos visuales, y resumir la partida con estadísticas divertidas.

### Inputs

| Input | Type | Required | Notes |
|---|---|---|---|
| `SimEvent` | `hit`, `rm`, `boom`, `fx`, `shield`, `king`… | Sí | Los mismos en el anfitrión y en los clientes |
| Cámara | `THREE.Camera` | Sí | Volumen y panorámica de cada sonido |
| Calidad | `low` \| `medium` \| `high` | Sí | Topes de partículas, fragmentos y chispas |
| `PlayerStats` | Estado | Al final | `dealt`, `bestShot`, `whiffs`, `worstMiss`, `selfHits`, bloques |

### Behavior

1. **Sonido 100 % sintetizado con WebAudio** (D-034), sin archivos:
   - Golpes distintos por material, explosiones, lanzamiento, mugido, cacareo, piano, imán, agujero negro, pompa, andamio, siseo de la lava, rumor de la lava que sube, trombón del rey caído, fanfarrias y tic de cuenta atrás.
   - Volumen `1 / (1 + d/28)` según la distancia a la cámara y panorámica según la posición en pantalla (×0,8).
   - Límite de repeticiones por tipo y compresor en la salida (umbral −14 dB, ratio 6).
   - El `AudioContext` solo nace con el primer gesto del usuario (D-037).
   - M o el botón silencian; la preferencia se guarda (`asedio.mute`).
2. **Partículas** (`Fx`): humo, polvo, anillos, explosiones con colores por munición, esquirlas por material, fuego, chispas y confeti.
   - Tope de humo 900 / 550 / 260 según la calidad (los trozos, el 60 %), y la cantidad por efecto se escala ×1 / ×0,7 / ×0,4.
   - **Polvo y humo tras un derrumbe** (WRK-TASK-049): cuando se rompen 3 bloques en menos de 3 s dentro de una celda de 5 m, nace allí un foco (`Fx.rubble`, `Fx.collapse`). Si ya hay otro a menos de 6 m, se aviva ese. Durante 10 s el foco suelta bocanadas grandes (1,4-2,2 m, que crecen hasta 2,6 veces) y translúcidas (opacidad 0,7), en tonos pardos y grises. Salen cada 0,35 / 0,5 / 0,75 s y cada vez más despacio, suben a 0,8-1,3 m/s y duran 5-7 s. Así la columna se ve durante los resultados y el principio de la ronda siguiente, y se disipa en unos 15 s. Reserva propia (`Fx.smoke`, un InstancedMesh): topes de 180 / 110 / 50 bocanadas y 9 / 6 / 3 focos. `clearSmoke` la vacía al reconstruir los castillos.
3. **Fragmentos** (D-009): trozos decorativos en un mundo físico local, no sincronizados. Máximo 260 / 170 / 90 y desaparecen a los 3-5 s.
4. **Rey caído:** confeti con su color, polvo, sacudida de cámara (+0,5), corona oculta, calavera en el marcador y rótulo.
   - **Rey animado** (WRK-TASK-051), solo en el modelo: el rey va articulado (`rig` con pivote en los pies, cabeza con la corona y dos brazos de un solo material y sin contorno). **Susto** durante 1,3 s: brazos arriba, cabeza que tiembla y saltitos. Lo provocan un golpe de fuerza > 300 a menos de 4 m, una explosión a menos de su radio + 3 m, un bloque roto a menos de 3 m o un proyectil que pasa a menos de 3,5 m. **Desmayo** al caer: se tumba de espaldas, con la cabeza ladeada y los brazos abiertos, en la medida en que la cápsula sigue de pie. Sale de `kingAlive`, así que en las repeticiones vuelve a ponerse de pie y a caer. En reposo, respiración suave y balanceo de brazos. Cuesta 2 llamadas de dibujo por rey (los brazos).
5. **Luz del atardecer y oclusión aproximada** (WRK-TASK-050, en todas las calidades): hemisférica de 1,2 y sol cálido `#ffe2b4` de 2,65, bajo. En el sombreador de los bloques, la parte baja de cada bloque baja al 80 % y lo que está a ras de suelo, al 78 %: las juntas entre hileras y la base de los castillos ganan volumen. Pendiente de la aprobación del usuario (WRK-TASK-053).
5. **Grietas** (WRK-TASK-039): un bloque dañado se oscurece y muestra grietas procedurales que se ensanchan con el daño, en el sombreador de los bloques y sin coste de CPU.
5. **Lava viva** (D-056), en shaders y sin coste de CPU: placas de costra con grietas incandescentes, latido en lo líquido, lava casi blanca junto al acantilado hasta que inunda la isla, y chispas que suben del mar (520 / 320 / 140). Viñeta cálida en los bordes. El nivel sube suavemente hasta el objetivo.
6. **Estadísticas finales** (D-035), en `#game-over`:
   - 💥 Mayor destrozo (bloques rivales rotos).
   - 🎯 Mejor disparo (más bloques en una ronda).
   - 💨 Disparo más desviado, solo si alguien falló. Fallar es un disparo no defensivo que no rompe nada. Cuenta la distancia al castillo rival más cercano menos 6,5 m.
   - ⚠️ Daño propio, solo si alguien rompió bloques propios.
   - 🏰 Castillo más entero.
   - Confeti y fanfarria sobre el castillo ganador.

### Outputs

| Output | Type | Notes |
|---|---|---|
| Audio | WebAudio | Mezcla estéreo |
| Partículas y fragmentos | Three.js | `view.fx.count`, `view.debris.count` (lo mide el banco) |
| Panel final | DOM | `#game-over` con `data-winner` y `data-rounds` |

### Known Limitations

- Si el anfitrión se va en plena fase de impacto, las estadísticas de esa ronda quedan incompletas.
- En la isla, los bloques que caen sobre la lava no se funden (solo se come la hilera al subir el nivel).
- La repetición reemite los eventos: los sonidos se oyen otra vez durante ella.

## Acceptance Criteria

- [ ] En la escena más cargada, las partículas y los fragmentos no pasan de su tope. El banco los registra, pero `tests/e2e/perf.spec.ts` no los comprueba.
- [x] La pantalla final aparece con ganador y rondas al acabar una partida.
- [ ] Sin gesto del usuario no se crea el `AudioContext` (sin prueba).
- [ ] El «disparo más desviado» solo aparece si algún jugador falló un disparo (sin prueba).

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Testing | `tests/e2e/solo.spec.ts` (partida completa y pantalla final) | 2026-09-26 | low → medium |
| Expert review | Capturas del README (`docs/capturas/final.png`) | 2026-09-25 | — |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `client/src/game/audio.ts` | `Sfx`: síntesis, espacialización, silencio |
| Implemented in | `client/src/game/render/models.ts` | `makeKing` articulado (`KING_NECK`, `KING_SHOULDER`) |
| Implemented in | `client/src/game/view.ts` | `startle` y `animateKings`: susto y desmayo del rey |
| Implemented in | `client/src/game/render/fx.ts` | Partículas, confeti y humo de derrumbe (`SMOKE_CAP`) |
| Implemented in | `client/src/game/sim/debris.ts` | Fragmentos locales |
| Implemented in | `client/src/game/render/materials.ts` | Oclusión aproximada de los bloques (`AO_APPLY`) |
| Implemented in | `client/src/game/render/stage.ts` | Shader de la lava, chispas, viñeta |
| Implemented in | `client/src/game/view.ts` | Efectos por evento (`king`, `boom`…) |
| Implemented in | `client/src/game/match/host.ts` | Estadísticas por ronda (`endImpact`, `closestMiss`) |
| Implemented in | `client/src/game/match/ui.ts` | `showOver` |
| Tested by | `tests/e2e/solo.spec.ts` | `#game-over` con `data-rounds` |
| Tested by | `tests/tools/bench.mjs` | Registra partículas y fragmentos máximos (a mano) |
| Decided in | D-009, D-034, D-035, D-037, D-056 | Fragmentos, sonido, estadísticas, AudioContext, lava |

## Open Questions

- README y CLAUDE.md (Fase 4) aún hablan de «cámara lenta» al caer un rey en directo; desde D-060 solo la hay en la repetición. — dimas
- ¿Se quiere que la repetición repita los sonidos, o que vaya en silencio o más baja? — dimas
