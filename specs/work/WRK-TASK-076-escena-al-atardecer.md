---
id: WRK-TASK-076
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 0.1.0
created: 2026-10-02
updated: 2026-10-02
owner: dimas
parent: WRK-PLAN-011
activates: [FEAT-SENSACION-001, FEAT-CONTROL-001, RULE-004]
dependencies:
  - id: WRK-TASK-074
    relation: depends-on
tags: [escena, render, diseno, rendimiento]
---

# WRK-TASK-076 — Escena al atardecer (R-10 fase 1, D2)

## Objective

Llevar la escena 3D al atardecer de la sección «Escena 3D» del design system, con las maquetas de «Nueva versión» como referencia de ambiente, sin perder legibilidad (castillos con el color de su jugador, parábola y anillo de impacto de R-01 y R-08) ni rendimiento en móvil.

## File Scope

- `client/src/game/render/stage.ts` (cielo, sol, luz, niebla, montañas, isla, lava, decorado, nubes, viñeta)
- `client/src/game/render/textures.ts` (tierra terracota en lugar de la hierba)
- `client/src/game/render/materials.ts` (contorno noche)
- `client/src/game/aim.ts` (contorno noche en la parábola y el anillo)

Fuera: modelos de catapultas, reyes y proyectiles, colores de castillo (R-02, `shared/players.ts`), efectos de partículas.

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-SENSACION-001 | Luz, lava y viñeta: mismo comportamiento, colores nuevos |
| FEAT-CONTROL-001 | Parábola y anillo de impacto (R-01): se tienen que seguir viendo claramente |
| RULE-004 | Sin pasar el presupuesto de rendimiento; banco antes y después |

- **Cielo:** hueso arriba, crema en medio y melocotón (#FDBE7A) en el horizonte, con la conversión de color de three.js para que los tonos salgan exactos. Sol grande, pálido y bajo (unos 8° en el cielo). Niebla melocotón, a las mismas distancias.
- **Luz:** sol `#ffd6a0` de 2,9 a unos 26° (rasante, con sombras más largas); hemisférica rosada arriba y ciruela abajo, así que la cara en sombra tira a ciruela, nunca a negro.
- **Montañas:** tres anillos de siluetas planas a 225, 280 y 340 m (vino, grana y naranja de cerca a lejos), sin luz ni niebla, en una sola malla con colores por vértice: una llamada de dibujo y unos 350 triángulos. Bajas para que quede cielo a la vista en la portada.
- **Isla:** tapa de tierra terracota (#C7663A, textura propia) y laterales vino que se oscurecen hacia ciruela. Islotes vino con tapa terracota. Pinos ciruela, rocas gris cálido y flores de la paleta.
- **Lava:** mar grana con brillos naranja; costra vino en menos superficie (umbral 0,62); naranja clara junto al acantilado. Se calcula en sRGB y se pasa a lineal para mezclar con la niebla.
  - Ajuste tras revisar las capturas (02-10-2026): más tranquila. Grana oscurecida hacia vino (placas al 30 % y al 62 % de vino), vetas naranja de un 1 % de ancho solo donde una segunda capa de ruido lo permite, sin el naranja amarillento que salía al posterizar, movimiento a la mitad y franja del acantilado más estrecha y sin crema.
- **Legibilidad:** sobre el cielo crema, los puntos de la parábola del color del jugador se perdían (sobre todo el rojo y el amarillo): llevan contorno noche (esferas algo mayores por dentro, mismas matrices, una llamada más). El anillo de impacto conserva el color del jugador sobre borde blanco (R-01) y gana un contorno noche. Contorno de bloques y decorado en noche (#200432).

## Acceptance Criteria

- [x] Cielo, sol, montañas, pinos, lava, islas terracota y luz cálida rasante como en la sección «Escena 3D».
- [x] Castillos de los cuatro colores, parábola y anillo legibles en PC y móvil vertical.
- [x] Rendimiento igual que antes en el banco (RULE-004): `perf.spec.ts` en verde.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `smoke`, `perf`, `controls`, `calidad`, `solo`, `hud-compact`, `touch`, `encuadre` |
| Banco | `node tests/tools/bench.mjs <base> medium gpu cpu=4 movil` y `high gpu`, producción (antes) contra la compilación local (después) |
| Capturas | `tests/tools/ui-shots.mjs` y la parábola cargando contra un castillo |

## Evidence

2026-10-02.
- Banco con una RTX 3080. Móvil 390×844, calidad media, CPU ×4: antes 7 fps de media (peor 5 % 4), paso de física 31,5 ms, 370 llamadas, 93 892 triángulos; después 7 fps (peor 5 % 5), 30,7 ms, 371 llamadas, 94 436 triángulos. PC calidad alta: 173 fps antes y después, 410 → 411 llamadas. En móvil manda la física, no el dibujo.
- Capturas en 1280×720 y 390×844: castillos azul, amarillo y rosa bien separados de la tierra terracota; el rojo (el tuyo en solitario) se distingue por el contorno y la madera rosada. Parábola cargando y anillo sobre el castillo azul legibles con el contorno noche.
