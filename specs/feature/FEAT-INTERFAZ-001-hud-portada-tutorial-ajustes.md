---
id: FEAT-INTERFAZ-001
type: spec
layer: feature
status: active
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
dependencies:
  - id: PROD-JUGAR-001
    relation: implements
  - id: DOM-JUEGO-001
    relation: uses-data-from
  - id: ARCH-005
    relation: constrained-by
  - id: FEAT-CONTROL-001
    relation: uses-data-from
supersedes: null
tags:
  - interfaz
  - hud
  - accesibilidad
  - tutorial
  - ajustes
---

# FEAT-INTERFAZ-001 — HUD, portada, tutorial y ajustes

## Intent

Quien llega por un enlace tiene que entender el juego en segundos y, en partida, ver de un vistazo el tiempo, su munición y cómo van los castillos. Esta especificación fija la interfaz en DOM (sin frameworks) que rodea al 3D.

## Definition

### Purpose

Portada, «Cómo se juega», tutorial de la primera partida, HUD de la partida y ajustes guardados en el navegador.

### Inputs

| Input | Type | Required | Notes |
|---|---|---|---|
| `MatchState` | Estado | Sí | Fase, tiempo, jugadores, viento, resultados |
| Teclas H y M | Teclado | No | Ayuda de controles y silencio |
| `localStorage` | `asedio.settings`, `asedio.quality`, `asedio.help`, `asedio.tutorial`, `asedio.name`, `asedio.mute` | No | Si falla, valores por defecto |
| `?tutorial=1`, `?backdrop=1`, `?quality=` | URL | No | Fuerzan tutorial, fondo o calidad (pruebas) |

### Behavior

1. **Portada:** título, nombre, «Crear sala» (o «Entrar en la sala ABCD»), «Jugar solo contra bots» (rivales 1-3, dificultad, campo de pruebas), «Cómo se juega» y «Ajustes».
   - Fondo animado: la isla con los 4 castillos y la cámara girando, sin física (D-043). No se crea en navegadores automatizados. Se desmonta al empezar la partida y vuelve con la revancha.
2. **Cómo se juega:** una ventana con 4 párrafos (rey, apuntado de 20 s, 3 municiones, lava y viento).
3. **Tutorial** (D-044), en la primera partida y solo mientras se puede apuntar:
   - Pasos: «Apunta» (avanza al apuntar con el clic derecho), «Elige munición» (con 1/2/3 o Q/E; avanza solo a los 7 s) y «¡Fuego!» (al soltar Espacio).
   - Se puede saltar. Al terminar se guarda y no vuelve. En solitario da 10 s más de apuntado en la ronda 1.
4. **HUD de partida:**
   - Arriba, la fase y el tiempo: urgente por debajo de 4 s y con tic sonoro en los 3 últimos.
   - A la izquierda, el marcador: estandarte, nombre, 🤖, «(tú)», % de castillo en pie, ✔ si está listo, 💀 si ha caído. Debajo, el panel de controles con teclas dibujadas (D-054), que se pliega con H y recuerda el estado. Solo se ve mientras se puede apuntar.
   - Abajo, potencia y elevación, 3 tarjetas de munición con color de rareza y tecla, y el botón de disparo.
   - En la esquina, el viento (flecha relativa a la cámara y m/s), silencio, ajustes y fps.
   - Rótulos: «RONDA N», «¡LA LAVA SUBE!», «¡REY ELIMINADO!» / «¡TU REY HA CAÍDO!», «REPETICIÓN».
   - Resultados: frase de la ronda y bloques perdidos y rotos por jugador. Un castillo sin daños pone «intacto» (D-055).
5. **Ajustes** (en portada y HUD):
   - Calidad baja / media / alta, que se aplica al momento (D-046).
   - Sonido, texto grande y mostrar fps (ocultos por defecto, D-055).
   - Sensibilidad del ratón de ×0,4 a ×1,8 (pasos de 0,1).
6. **Accesibilidad** (D-045): colores Okabe-Ito más un emblema por jugador (☀ ☾ ★ ϟ), con tinta oscura sobre amarillo y rosa. Hay texto grande y silencio.
7. **Pantallas estrechas** (≤ 700 px): marcador de 160 px y ayuda de controles oculta.

### Outputs

| Output | Type | Notes |
|---|---|---|
| DOM `#hud`, `#home`, `#howto`, `#tutorial`, `#settings`, `#game-over` | Elementos | Ids estables que usan las pruebas |
| Preferencias | `localStorage` | Sobreviven a recargas |

### Known Limitations

- Pensado para ratón y teclado: en táctil la interfaz no sirve para apuntar.
- Al cambiar la calidad en plena partida, los topes de partículas y fragmentos no cambian hasta la siguiente partida.
- La portada carga Rapier (1,1 MB comprimido) solo para el fondo animado.
- El HUD no se ha diseñado para vertical ni para móviles (plan de móviles, M2-M5).

## Acceptance Criteria

- [x] La portada carga sin errores y enseña el título y el panel `#home`.
- [x] En partida, el botón de disparo no aparece para un espectador.
- [x] Al final aparece `#game-over` con el ganador y el número de rondas.
- [ ] El panel de controles se pliega con H y sigue plegado tras recargar (sin prueba).
- [ ] Con texto grande, el marcador y la ayuda crecen (sin prueba).
- [ ] El tutorial avanza con cada acción y no vuelve tras terminarlo (sin prueba automática; se fuerza con `?tutorial=1`).

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Testing | `tests/e2e/smoke.spec.ts`, `tests/e2e/solo.spec.ts`, `tests/e2e/multiplayer.spec.ts` | 2026-09-26 | low → medium |
| Expert review | Capturas de `tests/tools/review.mjs` | 2026-09-25 | — |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `client/src/ui/hud.ts` | HUD, panel de controles, carga, rótulos |
| Implemented in | `client/src/ui/lobby.ts` | Portada, «Cómo se juega», «Jugar solo», lobby |
| Implemented in | `client/src/ui/tutorial.ts` | Tutorial de 3 pasos |
| Implemented in | `client/src/ui/settings.ts` | Ajustes y texto grande |
| Implemented in | `client/src/ui/backdrop.ts` | Fondo animado |
| Implemented in | `client/src/game/match/ui.ts` | `AIM_HELP`, resultados y pantalla final |
| Implemented in | `client/src/ui/style.css` | `@media (max-width: 700px)`, `.big-text`, `.replaying` |
| Implemented in | `shared/players.ts` | `PLAYER_STYLES` (Okabe-Ito y emblemas) |
| Tested by | `tests/e2e/smoke.spec.ts` | Portada sin errores |
| Tested by | `tests/tools/review.mjs` | Capturas para revisión a ojo |
| Decided in | D-043, D-044, D-045, D-046, D-054, D-055 | Portada, tutorial, accesibilidad, calidad, ayuda, fps |

## Open Questions

- Ajustes dice «Sensibilidad del tirachinas», pero el tirachinas ya no existe (D-059). ¿Se cambia a «Sensibilidad del ratón»? — dimas
- D-044 describe el paso 2 del tutorial con la rueda y 1/2; el código ya habla de 1/2/3 y Q/E. `DECISIONES.md` es histórico y no se toca. — dimas
