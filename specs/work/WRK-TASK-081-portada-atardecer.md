---
id: WRK-TASK-081
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
  - id: WRK-TASK-080
    relation: depends-on
tags: [interfaz, portada, movil, pc]
---

# WRK-TASK-081 — Portada «Atardecer» (R-10 fase 3: U9)

## Objective

Rehacer la portada según las maquetas «Móvil · Portada» (390×844) y «PC · Portada» (1280×720) del lienzo y el componente Botones del design system: título en dos líneas, nombre al azar sin tener que escribirlo, tablones JUGAR SOLO, CREAR SALA y UNIRSE CON CÓDIGO, y la ayuda y los ajustes en botones redondos. Sustituye a WRK-TASK-062 (R-06) y adelanta el campo «Unirse con código» de WRK-TASK-069 (F4).

## File Scope

- `client/src/ui/lobby.ts` (`showHome`, `savedName`, píldora del nombre, «Cómo se juega»), `client/src/main.ts`, `client/src/ui/icons.ts`, `client/src/ui/backdrop.ts`, `client/src/game/render/stage.ts` (desplazamiento horizontal), `client/src/ui/style.css`
- `shared/players.ts` (`randomName`, `NAME_TITLES`, `shortName`)
- `tests/e2e/portada.spec.ts`, `tests/e2e/helpers.ts` (`setName`), `tests/e2e/lobby.spec.ts`, `tests/e2e/multiplayer.spec.ts`, `tests/e2e/pwa.spec.ts`, `tests/e2e/smoke.spec.ts`, `tests/unit/players.test.ts`

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-INTERFAZ-001 | Portada con `#home`; fondo animado sin Rapier; ids estables para las pruebas |

- **Título:** «ASEDIO / LOCO» en Lilita, crema con contorno noche y sombra dura (70/62 px en móvil, 84/74 en PC); en móvil, debajo, «Castillos, catapultas y vacas explosivas» en noche (con un filo crema por si pasa por encima de un castillo en pantallas bajas). En PC no lleva el subtítulo, como la maqueta.
- **Nombre:** píldora «Juegas como <nombre>» con el dado (`#name-random`, otro al azar) y el lápiz (`#name-edit`, se edita en el sitio en `#name`; Intro o salir del campo lo guarda, vacío da otro al azar, Escape lo deja). La primera vez se crea uno al azar (`randomName`: un título como los de los bots y una palabra corta, «Duque Pepino», de 16 letras como mucho) y se guarda en `asedio.name`. El nombre corto de un humano con título es la última palabra («Pepino»).
- **Tablones:** JUGAR SOLO (naranja, principal), CREAR SALA y UNIRSE CON CÓDIGO (crema), inclinados −1,2°, +0,9° y −0,5°. Unirse: en PC, el campo `#code` y UNIRSE en una fila; en móvil, el tablón se abre en esa fila (decisión del usuario del 03-10-2026). El código se pasa a mayúsculas y se comprueba con `GET /api/rooms/:code` antes de entrar; si no existe, una píldora grana con texto crema lo dice.
- **Invitación** (`#ABCD`): «Te invitan a la sala ABCD» y ENTRAR como tablón naranja, con JUGAR SOLO y CREAR SALA en crema (decisión del usuario del 03-10-2026).
- **Botones redondos** de 52 px: ayuda (`#how-to`) a la izquierda y ajustes (`#open-settings`) a la derecha; en PC, juntos abajo de la columna.
- **Disposición:** en vertical, el título centrado sobre el cielo y el menú abajo sobre noche al 55 %; en horizontal, una columna de 520 px a la izquierda sobre noche al 88 % con la escena a la derecha. En ventanas bajas (≤ 720 px en vertical, ≤ 620 y ≤ 460 px en horizontal) todo se aprieta; en un móvil tumbado la ayuda y los ajustes suben junto al título.
- **Fondo:** la cámara del fondo animado baja (13 m en vertical, 20 en horizontal) para que el cielo quede detrás del título, y la isla se encuadra en lo que deja libre el menú (`Stage.setViewShift` con desplazamiento horizontal).
- **«Cómo se juega»:** seis puntos con iconos SVG (corona, mano o ratón, la vaca ilustrada, diana, escudo y viento), sin emoji, y el apuntado según el formato (pad de la bandeja, arrastre táctil o ratón).
- Sin emoji en la portada ni en la sala (el número de espectadores lleva el icono del ojo).

## Acceptance Criteria

- [x] El nombre al azar aparece la primera vez y persiste al recargar; el dado y el lápiz lo cambian y también persisten.
- [x] En 1280×720, 390×844 y 360×740 nada se sale ni se cruza, y lo táctil mide 44 px o más.
- [x] Unirse con código avisa de un código mal escrito o de una sala que no existe.
- [x] Con un enlace de invitación, ENTRAR es el tablón principal.
- [x] «Cómo se juega» y la portada sin emoji.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | `tests/unit/players.test.ts`: nombres al azar válidos y nombre corto |
| E2E | `tests/e2e/portada.spec.ts` (portada en PC y en vertical), `lobby.spec.ts` y `multiplayer.spec.ts` con el lápiz |

## Evidence

2026-10-03. `portada.spec.ts` en verde en los tres tamaños; capturas locales con GPU de la portada, la invitación y la fila de unirse comparadas con las maquetas.
