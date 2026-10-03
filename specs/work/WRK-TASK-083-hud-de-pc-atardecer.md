---
id: WRK-TASK-083
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
activates: [FEAT-INTERFAZ-001]
dependencies:
  - id: WRK-TASK-082
    relation: depends-on
tags: [interfaz, hud, pc]
---

# WRK-TASK-083 — HUD de PC con las piezas del móvil (R-10 fase 3: U11)

## Objective

Llevar al HUD de PC las piezas de la fase 2 según la maqueta «PC · Apuntando» (1280×720) y el componente Marcador: jugadores en chips, ronda y segundos en una píldora, viento y objetivo en chips, cartas de 92×92, barra de potencia bajo las cartas, controles plegados en un chip y la elevación en una esquina.

## File Scope

- `client/src/ui/hud.ts` (píldora, chips, viento, objetivo, potencia, elevación, controles), `client/src/ui/tutorial.ts` (paso 3 en PC), `client/src/ui/icons.ts`, `client/src/ui/style.css`
- `client/src/game/match/ui.ts` (quién falta, también en PC), `client/src/game/modes/sandbox.ts`
- `tests/e2e/hud-compact.spec.ts`, `tests/e2e/tutorial.spec.ts`, `tests/e2e/solo.spec.ts`

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-INTERFAZ-001 | HUD de partida; panel de controles con H; HUD compacto por debajo de 500 px de alto |

- **Arriba a la izquierda:** `#hud-players` en una columna de chips de 190 px (emblema, nombre corto, barra; el tuyo con borde crema; la marca de listo, la cruz o la desconexión a la derecha del nombre). Sin porcentaje; el nombre completo, en `title` y `aria-label`. Son los mismos elementos que en móvil vertical, cambiados de sitio.
- **Arriba al centro:** la píldora `#hud-round` (52 px, «Ronda N» en Lilita 22 y los segundos en un círculo naranja de 40 px), sin «Fase de apuntado». En el campo de pruebas, solo el texto.
- **Arriba a la derecha:** el chip del viento (flecha y fuerza, «→ 2»; sin viento no está), el del objetivo (borde naranja) y el engranaje redondo de 44 px. Sin botón de silencio: el sonido va en Ajustes y la tecla M sigue valiendo.
- **Abajo al centro:** las cartas de 92×92 (la elegida sube 6 px con el anillo naranja, sin crecer) con la descripción al pasar el ratón (WRK-TASK-078); debajo, la barra de potencia `#hud-power` de 300 px (ciruela, se llena de naranja al cargar) y la pista «Mantén [Espacio] o clic para cargar» («Suelta para disparar» al cargar; con el disparo listo, «Disparo listo · Esperando a … · N de M listos»). Con ratón no hay botón de disparo.
- **Abajo a la izquierda:** el chip `#help-toggle` «Controles · H» (teclado SVG); H o un clic abren la lista encima y la cierran. Plegado por defecto; recuerda si se abrió (`asedio.controles`).
- **Abajo a la derecha:** la elevación `#hud-elev` en Lilita 30 con contorno noche y la etiqueta «elevación».
- **Tutorial:** en PC, el paso 3 resalta la barra de potencia.
- **Con el dedo en horizontal** siguen el botón redondo y las flechas de castillo (iconos SVG); sin barra ni elevación. Por debajo de 500 px de alto, todo más pequeño (píldora de 40 px, chips de 124 px, cartas de 64).
- Sin emoji en el HUD: flechas de castillo, chip de controles y marca de listo con iconos SVG.

## Acceptance Criteria

- [x] En 1280×720 y 1024×600 las piezas están donde dice la maqueta, dentro de la pantalla y sin cruzarse.
- [x] H abre y cierra los controles.
- [x] Las cartas miden 92×92 y la barra de potencia 300 px; al cargar se llena y, al soltar, la pista dice a quién se espera.
- [x] En móvil (vertical y horizontal) el HUD no cambia de comportamiento.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `tests/e2e/hud-compact.spec.ts` («HUD de PC» en dos tamaños y los seis móviles), `tutorial.spec.ts`, `controls.spec.ts` (descripción al pasar el ratón) |

## Evidence

2026-10-03. Suites `hud-compact`, `tutorial`, `controls`, `solo`, `touch` y `espectador` en verde en local; capturas con GPU de apuntando, la descripción, los controles abiertos, cargando y disparo listo, comparadas con la maqueta.
