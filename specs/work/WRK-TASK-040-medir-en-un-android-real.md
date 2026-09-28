---
id: WRK-TASK-040
type: spec
layer: work-task
scope: ephemeral
status: draft
confidence: low
version: 0.1.0
created: 2026-09-27
updated: 2026-09-27
owner: dimas
parent: WRK-PLAN-004
activates: [ARCH-005, RULE-004]
tags: [movil, rendimiento]
---

# WRK-TASK-040 — Medir el rendimiento en un Android real

## Objective

Confirmar en un teléfono Android real lo que hasta ahora solo se ha medido con emulación: rendimiento, control táctil, horizontal y temperatura. **Son pruebas opcionales** que solo puede hacer el usuario; ninguna tarea depende de ellas.

## File Scope

- `specs/architecture/ARCH-005-rendimiento-y-calidad-adaptativa.md` (tabla de mediciones)
- Tareas nuevas si alguna prueba descubre un problema

Fuera: código del juego.

## Implementation Notes

Pruebas (URL: `https://asedio-loco.dimasmijares.workers.dev`):

| N.º | Prueba | Cómo | Qué anotar |
|---|---|---|---|
| A1 | Rendimiento en solitario | En vertical, activar «Mostrar fps» en Ajustes y jugar unas rondas contra 3 bots | Modelo del teléfono, fps al apuntar y durante el impacto |
| A2 | Escena de referencia | Abrir `/#bench` y esperar al final | fps medios del resultado |
| A3 | Móvil como anfitrión | Crear una sala desde el móvil y entrar desde otro dispositivo, sin PC en la sala | Si los impactos van fluidos o a cámara lenta |
| A4 | Control táctil | Apuntar arrastrando, disparar con 🔥 y cambiar de objetivo con ◀ ▶ | Qué resulta incómodo o impreciso |
| A5 | Horizontal | Girar el móvil durante una partida | Qué se tapa o se lee mal |
| A6 | Batería y temperatura | Jugar una partida completa (2-3 minutos) | Si el teléfono se calienta de forma notable |
| A7 | Instalar en Android (WRK-TASK-009) | En Chrome, menú ⋮ → «Instalar aplicación» o «Añadir a pantalla de inicio», y abrirla desde el icono | Si se abre a pantalla completa, sin barras, y si se puede girar |
| A8 | Instalar en iPhone (WRK-TASK-009) | En Safari, Compartir → «Añadir a pantalla de inicio», y abrirla desde el icono | Si se abre sin las barras de Safari |

## Acceptance Criteria

- [ ] Resultados de las pruebas que haga el usuario anotados en ARCH-005 (A1-A3) o en Evidence (A4-A6).
- [ ] Si el impacto baja de 20 fps (A1, A3), se abre una tarea con la causa; WRK-TASK-052 ya ataca el coste de la física.
- [ ] Cada problema de control o de interfaz (A4, A5) se convierte en una tarea.
- [ ] Resultado de A7 y A8 anotado en WRK-TASK-009 (Evidence) y en FEAT-INTERFAZ-001; si algo falla, una tarea.

## Test Plan

| Level | What it covers |
|-------|----------------|
| Manual | Teléfono Android del usuario |

## Evidence

Pendiente.
