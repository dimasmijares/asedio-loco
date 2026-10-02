---
id: WRK-TASK-074
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
activates: [FEAT-INTERFAZ-001]
dependencies:
  - id: WRK-TASK-060
    relation: depends-on
tags: [interfaz, diseno, estilo]
---

# WRK-TASK-074 — Estilo «Atardecer» en la interfaz (R-10 fase 1, E1-E3)

## Objective

Aplicar a la interfaz en DOM el estilo aprobado en R-10 el 01-10-2026: paleta (E1), letra (E2) y tablones de madera en los menús (E3), sin cambiar la disposición de ninguna pantalla. Fuente de verdad: el design system «Asedio Loco · estilo» (https://claude.ai/artifact/D3UZsBmqS3PPWLsKYptLj3), su `README.md`, `tokens.json` y la guía del componente Botones.

## File Scope

- `client/src/ui/style.css`, `client/src/ui/fonts/` (woff2 y licencias OFL)
- `client/src/ui/hud.ts`, `client/src/ui/lobby.ts`, `client/src/game/match/ui.ts` (solo clases y colores en línea)
- `shared/ammo.ts` (`RARITY_COLOR`, `RARITY_INK`)
- `client/index.html`, `client/public/manifest.webmanifest` (color del tema)
- `tests/tools/ui-shots.mjs` (capturas nuevas para revisar)

Fuera: `shared/players.ts` (D1: los Okabe-Ito no se tocan), la disposición de las pantallas y los puntos U1-U11 (fases 2 y 3).

## Implementation Notes

| Activated spec | What it requires of this task |
|----------------|-------------------------------|
| FEAT-INTERFAZ-001 | Las pantallas existentes y sus ids estables; la accesibilidad (emblema junto al color, texto grande) |

- **E1 Paleta:** los tokens pasan a variables `--al-<token>` en `:root`; las variables antiguas (`--ink`, `--panel`, `--accent`…) apuntan a ellas. Grana solo en el botón de disparo, «¡FUEGO!», el reloj en sus últimos segundos, «REY ELIMINADO», errores y el tablón «Salir»; naranja solo en lo pulsable o elegido (tablón principal, carta elegida, foco, potencia) y en el reloj y el chip del objetivo, como piden los componentes Marcador y BandejaMovil.
- **E2 Letra:** Lilita One (títulos, botones, cifras) y Nunito variable (600-900) en woff2 desde el repositorio, solo subconjuntos latin y latin-ext con `unicode-range`; pilas de respaldo de `tokens.json`. `font-synthesis: none` para que Lilita (un solo peso) no se engorde a la fuerza.
- **E3 Tablones:** `button.big` es el tablón: borde 3 px noche, veta, brillo, canto, sombra dura, dos clavos y una inclinación alterna. Texto en mayúsculas. El HUD de partida no tiene tablones y va recto.
  - Ajuste tras revisar las capturas (02-10-2026): la regla de cada tercer tablón (−0,6°) podía dejar dos seguidos inclinados hacia el mismo lado. Ahora alterna siempre: −1,2° y +0,9°, dentro de ±0,5° a ±1,5° (guía de Botones), y solo dentro de un panel de menú (`.panel`); fuera de él, 0°.
- **Decisiones del usuario (02-10-2026):** la rareza «Defensiva», sin token, usa `listo` (#9ED36A) con texto noche; el marcador compacto del móvil conserva sus 9-11 px hasta que la fase 2 (U4) lo rehaga; en esta fase solo se sustituyen los emoji de la munición (WRK-TASK-075), el resto de iconos llega con las fases 2 y 3.
- Las etiquetas largas de los tablones («Jugar solo contra bots», «Campo de pruebas (munición ilimitada)») no caben en dos palabras: el texto se ajusta de tamaño (`clamp`) y el del campo de pruebas puede ir en dos líneas hasta que la fase 3 (U10) lo convierta en enlace.

## Acceptance Criteria

- [x] Ningún color de la interfaz fuera de los tokens, salvo los de jugador (Okabe-Ito) y el fondo de la carta sin elegir de CartaMunicion (#F3D9A4).
- [x] Lilita One y Nunito servidas desde el repositorio en woff2.
- [x] Tablones en los menús (portada, Jugar solo, sala, ajustes, cómo se juega, final) y HUD recto.
- [x] Contraste de texto ≥ 4,5:1 (3:1 desde 24 px) en las parejas usadas.
- [x] Nada se corta en 390×844 ni en 1280×720; las E2E de interfaz siguen en verde.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Unit | `npm test` |
| E2E | `smoke`, `hud-compact`, `tutorial`, `touch`, `pwa`, `lobby`, `solo` |
| Capturas | `node tests/tools/ui-shots.mjs <base> <carpeta>`: portada, Jugar solo, apuntando y resultados en PC y móvil vertical |

## Evidence

2026-10-02.
- Contrastes calculados (WCAG): crema/noche 15,4:1; crema/ciruela 12,7:1; noche/naranja 7,9:1; vino/crema 9,0:1; crema/grana 4,6:1; noche/hueso 17,4:1; noche sobre las bandas de rareza 6,6:1 (común), 7,2:1 (rara) y 10,7:1 (defensiva); crema sobre épica 5,4:1; listo/ciruela 8,8:1.
- Capturas de `ui-shots.mjs` en 1280×720 y 390×844: nada se corta; «Jugar solo contra bots» cabe en una línea en el móvil y «Campo de pruebas (munición ilimitada)» va en dos.
