---
id: WRK-TASK-077
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
activates: [FEAT-INTERFAZ-001, FEAT-CONTROL-001, FEAT-CAMARA-001]
dependencies:
  - id: WRK-TASK-076
    relation: depends-on
tags: [interfaz, hud, movil, controles]
---

# WRK-TASK-077 — Bandeja del pulgar en móvil vertical (R-10 fase 2: U1, U3, U8)

## Objective

En la partida en móvil vertical, llevar todo lo que se toca a una bandeja en el 30 % inferior, al alcance del pulgar: botón de disparo, pad de puntería y cartas. La potencia se ve en el propio botón, hay modo zurdo y la cámara centra la escena en lo que queda libre. Fuente de verdad: el design system (README, «Partida en móvil: zonas»; componente BandejaMovil) y las maquetas «Móvil · Apuntando» y «Cargando la fuerza» de la página «Nueva versión» del lienzo, a 390×844.

## File Scope

- `client/src/ui/hud.ts` (bandeja, pad, botón redondo), `client/src/ui/icons.ts` (iconos SVG), `client/src/ui/style.css`
- `client/src/ui/settings.ts` (modo zurdo), `client/src/ui/tutorial.ts` (pasos con la bandeja)
- `client/src/device.ts` (`TRAY_QUERY`), `client/src/game/aim.ts` (`padMove`), `client/src/game/render/stage.ts` (`setViewShift`)
- `client/src/game/match/ui.ts`, `client/src/game/modes/sandbox.ts` (textos y desplazamiento de la escena)
- `tests/e2e/touch.spec.ts`, `tests/e2e/hud-compact.spec.ts`, `tests/e2e/tutorial.spec.ts`

Fuera: la parte superior (WRK-TASK-079), la tarjeta de descripción (WRK-TASK-078), lo que pasa tras disparar (WRK-TASK-080), el HUD de PC (U11) y el móvil en horizontal.

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-INTERFAZ-001 | Ids estables del HUD (`#confirm`, `#hud-ammo`), tutorial que resalta el control que toca |
| FEAT-CONTROL-001 | Mismos límites de puntería y carga; la escena sigue sirviendo para apuntar |
| FEAT-CAMARA-001 | El encuadre de apuntado no cambia: solo se desplaza el centro de la imagen |

- **Cuándo:** `(orientation: portrait) and (max-width: 600px)` (`TRAY_QUERY`); el HUD lo vigila con `matchMedia` y pone la clase `tray-mode`, así que girar el móvil cambia de disposición en plena partida. El botón de disparo y la fila de cartas son los mismos elementos de siempre: se mueven a la bandeja.
- **Bandeja:** ciruela, `radius-lg` arriba, 252 px a 844 (7 px fijos y 245 que escalan con `--k`), con el margen inferior de la maqueta (37 px) o la zona segura del sistema más 6 px si es mayor. `--k` la reduce para no pasar del 30 % del alto ni del ancho (360×780: 0,928). Solo se ve mientras se puede apuntar.
- **Botón de disparo:** grana de 100 px con anillo crema oscuro, a la izquierda; dentro, la llama y «MANTÉN». Al mantenerlo, el anillo exterior (118 px) se llena de naranja y dentro van el porcentaje y «SUELTA»; el pad se apaga al 45 %. En el móvil en horizontal el botón redondo también cambia el emoji por la llama y el porcentaje.
- **Pad de puntería** (222×112, a la derecha): arrastre relativo con la ganancia del ratón (0,0035 rad/px de rumbo y 0,0028 de elevación, por la sensibilidad); la bola sigue al dedo y vuelve al centro; la elevación va arriba a la derecha. Arrastrar en la escena sigue apuntando, con más ganancia, para los giros grandes.
- **Cartas:** fila de 108×62 bajo botón y pad, con la tecla en la esquina. Con más de tres (campo de pruebas, decisión del usuario del 02-10-2026), la fila se desliza en horizontal.
- **Modo zurdo** (U8): casilla en Ajustes, guardada en `asedio.settings` (`leftHanded`); espeja botón y pad.
- **Cámara:** `Stage.setViewShift(px)` desplaza el centro de la imagen con `setViewOffset` (sin cambiar el campo de visión), suavizado. Con la bandeja, la mitad de su alto: lo que mira la cámara queda en el centro de la parte libre.
- **Fallo previo corregido:** en Ajustes, `modal.onclick = (e) => e.target === modal && shut()` devolvía `false` en cualquier clic dentro del panel, lo que cancela el clic: ninguna casilla cambiaba.
- **Sin emoji** en lo tocado: llama y marca en SVG (`icons.ts`, trazo 2,5 px en `currentColor`), y «el botón de disparo» o «el botón rojo» en los textos en lugar de 🔥.

## Acceptance Criteria

- [x] Bandeja de como mucho el 30 % del alto, con el disparo a la izquierda y el pad a la derecha; botón, pad y cartas dentro y sin cruzarse (390×844, 360×780 y 412×915).
- [x] El pad gira y eleva; la escena sigue apuntando; mantener el botón carga y enseña porcentaje y «SUELTA»; al soltar, la bandeja se recoge.
- [x] Modo zurdo desde Ajustes, guardado, espeja botón y pad.
- [x] Todo lo táctil mide 44 px o más.
- [x] Las E2E de táctil, HUD compacto, tutorial y controles pasan.

## Test Plan

| Level | What it covers |
|-------|----------------|
| E2E | `touch.spec.ts` (bandeja, pad, carga, modo zurdo), `hud-compact.spec.ts` (sin solapes, 30 %), `tutorial.spec.ts`, `controls.spec.ts` |
| Capturas | Diestro y zurdo en 390×844 con GPU: apuntando, arrastrando en el pad, cargando y tras disparar |

## Evidence

2026-10-02. En 390×844: bandeja de 252 px (desde y = 592), botón en (23, 618) de 100 px, pad en (154, 612) de 222×112 y cartas de 108×62 a partir de y = 739; la escena sube 126 px. Arrastrar 48 px a la derecha y 24 arriba en el pad gira 0,168 rad y eleva 0,067 rad. `touch`, `hud-compact`, `tutorial` y `controls` en verde.
