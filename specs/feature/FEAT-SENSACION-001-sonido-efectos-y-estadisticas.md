---
id: FEAT-SENSACION-001
type: spec
layer: feature
status: active
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
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
3. **Fragmentos** (D-009): trozos decorativos en un mundo físico local, no sincronizados. Máximo 260 / 170 / 90 y desaparecen a los 3-5 s.
4. **Rey caído:** confeti con su color, polvo, sacudida de cámara (+0,5), corona oculta, calavera en el marcador y rótulo.
5. **Lava viva** (D-056), en shaders y sin coste de CPU: placas de costra con grietas incandescentes, latido en lo líquido, lava casi blanca junto al acantilado hasta que inunda la isla, y chispas que suben del mar (520 / 320 / 140). Viñeta cálida en los bordes. El nivel sube suavemente hasta el objetivo.
6. **Estadísticas finales** (D-035), en `#game-over`:
   - 💥 Mayor destrozo (bloques rivales rotos).
   - 🎯 Mejor disparo (más bloques en una ronda).
   - 🤡 Disparo más ridículo, solo si alguien falló. Fallar es un disparo no defensivo que no rompe nada. Cuenta la distancia al castillo rival más cercano menos 6,5 m.
   - 🙈 Autogol, solo si alguien rompió bloques propios.
   - 🏰 Castillo más entero.
   - Confeti y fanfarria sobre el castillo ganador.

### Outputs

| Output | Type | Notes |
|---|---|---|
| Audio | WebAudio | Mezcla estéreo |
| Partículas y fragmentos | Three.js | `view.fx.count`, `view.debris.count` (lo mide el banco) |
| Panel final | DOM | `#game-over` con `data-winner` y `data-rounds` |

### Known Limitations

- Al cambiar la calidad en plena partida, los topes de partículas y fragmentos no cambian hasta la siguiente partida.
- Si el anfitrión se va en plena fase de impacto, las estadísticas de esa ronda quedan incompletas.
- En la isla, los bloques que caen sobre la lava no se funden (solo se come la hilera al subir el nivel).
- La repetición reemite los eventos: los sonidos se oyen otra vez durante ella.

## Acceptance Criteria

- [ ] En la escena más cargada, las partículas y los fragmentos no pasan de su tope. El banco los registra, pero `tests/e2e/perf.spec.ts` no los comprueba.
- [x] La pantalla final aparece con ganador y rondas al acabar una partida.
- [ ] Sin gesto del usuario no se crea el `AudioContext` (sin prueba).
- [ ] El «disparo más ridículo» solo aparece si algún jugador falló un disparo (sin prueba).

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Testing | `tests/e2e/solo.spec.ts` (partida completa y pantalla final) | 2026-09-26 | low → medium |
| Expert review | Capturas del README (`docs/capturas/final.png`) | 2026-09-25 | — |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `client/src/game/audio.ts` | `Sfx`: síntesis, espacialización, silencio |
| Implemented in | `client/src/game/render/fx.ts` | Partículas y confeti |
| Implemented in | `client/src/game/sim/debris.ts` | Fragmentos locales |
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
