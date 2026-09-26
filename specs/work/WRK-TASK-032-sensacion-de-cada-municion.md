---
id: WRK-TASK-032
type: spec
layer: work-task
scope: ephemeral
status: completed
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-PLAN-007
activates: [DOM-JUEGO-003, RULE-001, FEAT-SENSACION-001, FEAT-INTERFAZ-001]
tags: [municion, equilibrio]
---

# WRK-TASK-032 — Sensación propia de cada munición

## Objective

Que cada disparo se note: temblor de cámara proporcional al destrozo, efecto y sonido característicos por munición y la tarjeta explicando su identidad en pocas palabras.

## File Scope

- `client/src/game/camera.ts` o `director.ts` (temblor)
- `client/src/game/render/` (efectos) y `client/src/game/audio.ts` (sonidos)
- `shared/ammo.ts` (`desc` de cada tarjeta)

## Implementation Notes

Temblor corto según los bloques rotos en el último medio segundo, que se puede quitar en ajustes (y se quita solo con `prefers-reduced-motion`). Descripciones cortas para que quepan en la tarjeta en vertical.

## Acceptance Criteria

- [x] Temblor según el destrozo, que se puede desactivar.
- [x] Cada munición con su efecto y su sonido.
- [x] Descripciones nuevas legibles en móvil en vertical.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Medición | `destrozo` (12 disparos) y `balance` normal y difícil con `GAMES=8`, antes y después |
| E2E | Grupos `fisica` y `solitario` |

## Evidence

- **Temblor:** cada bloque roto suma 0,035 al temblor de la vista, con tope de 1,3 (antes solo temblaban las explosiones y la caída de un rey). Se desactiva con «Temblor de cámara» en Ajustes (`settings.shake`), que por defecto está activado salvo con `prefers-reduced-motion`.
- **Efectos y sonidos propios, añadidos en las tareas 028-031:** huevo (yema, cáscara y petardo agudo), acorde del piano (polvo, teclas y golpe grave con notas bajas) y retroceso del imán (anillo rojo, chispas y zumbido metálico). El resto ya los tenía: vaca (mugido y explosión), sandía (colores de sandía), cocos (división), agujero negro (implosión morada), bola de nieve (nieve) y gallina (cacareo y plumas).
- **Descripción en el HUD:** línea `#hud-ammo-desc` con lo que hace la munición elegida. En móvil no había forma de leerla, porque solo estaba en el `title`. Textos nuevos del pedrusco, el piano, el agujero negro, el imán y la bola de nieve (los demás, en 029).
- **Pruebas:** `hud-compact.spec.ts` incluye la línea nueva en la comprobación de solapes en los 5 tamaños. El botón 🔥 sube a 124 px del borde en vertical para dejarle sitio. E2E `hud-compact`, `touch` y `controls` en local: 9 de 9.
