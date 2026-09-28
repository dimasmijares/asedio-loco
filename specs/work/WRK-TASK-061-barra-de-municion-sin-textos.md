---
id: WRK-TASK-061
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 0.1.0
created: 2026-09-28
updated: 2026-09-28
owner: dimas
parent: WRK-PLAN-011
activates: [FEAT-INTERFAZ-001, FEAT-CONTROL-001]
dependencies:
  - id: WRK-TASK-060
    relation: depends-on
tags: [interfaz, diseno]
---

# WRK-TASK-061 — Barra de munición sin textos y con la rareza a la vista

## Objective

Sale del primer comentario del usuario en el lienzo (WRK-TASK-060, 28-09-2026): menos texto y más calidad visual en la zona de apuntado.

## File Scope

- `client/src/ui/hud.ts`, `client/src/ui/style.css`, `client/src/game/match/ui.ts`
- `tests/e2e/` (selectores y capturas en PC y móvil vertical)
- `specs/feature/FEAT-INTERFAZ-001-hud-portada-tutorial-ajustes.md`

## Implementation Notes

Comentario del usuario, punto por punto:

1. Fuera el texto «Potencia … (m/s) · Elevación … · munición»: no aporta; la parábola ya lo dice.
2. La tarjeta con la descripción de la munición, más cuidada y bonita.
3. Fuera las flechas ◀ ▶ junto a la munición: la munición se elige tocándola. (Si las flechas sirven también para cambiar de castillo objetivo o de castillo en el espectador, ese uso necesita otro sitio: decidir con el usuario.)
4. La munición elegida, mucho más destacada.
5. Botones de munición más grandes y con el color de su rareza muy visible, para notar cuál es mejor.

Segundo comentario (PC, 28-09-2026):

6. El panel de controles ocupa demasiado: más compacto.
7. Fuera A/W/S/D del panel (y como atajo de apuntado, si se confirma): en PC se apunta con el ratón.
8. Q/E, rotulado como cámara. Hoy cambian el castillo objetivo, que mueve la cámara hacia él; el rótulo debe decir eso y nada más.

Decisiones del usuario (28-09-2026) sobre las flechas:

9. **Jugando no se elige castillo objetivo.** Hoy ◀ ▶ (y Q/E) giran la catapulta de golpe hacia otro castillo rival, que queda como «objetivo». Ese objetivo se usa para los arcos de «quién ataca a quién» (WRK-TASK-045) y el encuadre. Desaparece el selector: el objetivo se deduce solo del rumbo, como el castillo rival más cercano a la dirección en que apuntas. En PC, Q/E se quedan como atajo de cámara (punto 8).
10. **Espectador:** a la derecha, en pequeño, una miniatura por castillo con el nombre del jugador encima y el % de destrucción de su castillo; tocarla lleva la cámara a ese castillo. Sustituye a ◀ ▶ del espectador (WRK-TASK-042). Se enseña antes en el lienzo.

Barra de móvil aprobada (R-03, 28-09-2026). Arreglo pedido: en la maqueta, la franja oscura de la barra tapa el botón de disparo y su anillo de %; en el juego el botón queda siempre por encima.

Propuesta en el lienzo: «Propuesta · Barra de munición sin textos (móvil)», interactiva. Falta la versión de PC y la aprobación del usuario.

## Acceptance Criteria

- [x] El usuario aprueba la propuesta en el lienzo: móvil en R-03; PC, en R-04 (pendiente de su respuesta).
- [x] HUD sin la línea de potencia y elevación, sin flechas junto a la munición, con cartas por rareza y la elegida destacada, en 1280×720 y 390×844; horizontal sin solapes.
- [x] El objetivo se deduce del rumbo (E2E `touch.spec.ts`); sin selector de objetivo en la interfaz.
- Espectador: el selector de castillos pasa a WRK-TASK-073, a la espera de R-05.
- [x] Panel de controles de PC compacto, sin A/W/S/D y con Q/E como cámara.
- [x] E2E de HUD en verde (`hud-compact.spec.ts` y las que usan los selectores).

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | HUD compacto, selección de munición, capturas |

## Evidence

2026-09-28.
- Sin la línea «Potencia · Elevación · munición» (`setAimInfo` solo deja la del espectador).
- Tarjeta de la munición elegida estilo pergamino: icono en un cuadro del color de la rareza, nombre, etiqueta de rareza y qué hace. En móvil vertical, a la izquierda sin tapar el botón de disparo, que queda por encima de la barra.
- Cartas de 84 px (88 en vertical, 64 en horizontal) con borde y banda del color de la rareza; la elegida crece, sube y brilla con ese color. Común pasa de `#8d99ae` a `#6c7689` para que el texto blanco se lea.
- Jugando no hay flechas: el castillo objetivo sale del rumbo (`aimedAt`) y se manda al anfitrión cuando cambia. Las flechas quedan para el espectador hasta WRK-TASK-073.
- Panel de PC: sin A/W/S/D (las teclas siguen funcionando); Q/E rotuladas «cámara: mirar a otro castillo». En táctil, sin la fila de las flechas.
- Arreglo descubierto: la vista reservaba 640 bloques por material y con 236 por castillo hay 764 de piedra; faltaban bloques en pantalla (`smoke.spec.ts` lo cazó). Capacidad = 4 × `BLOCKS_PER_CASTLE`.
- E2E locales: `hud-compact` (6 tamaños), `touch`, `tutorial`, `espectador`, `controls`, `smoke` y `solo`, 18/18 en verde.
