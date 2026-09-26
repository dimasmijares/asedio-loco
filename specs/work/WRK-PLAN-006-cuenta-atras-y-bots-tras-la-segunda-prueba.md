---
id: WRK-PLAN-006
type: spec
layer: work-plan
scope: ephemeral
status: active
confidence: medium
version: 0.1.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
parent: WRK-SPEC-006
activates: [DOM-JUEGO-001, FEAT-CAMARA-001, FEAT-BOTS-001, RULE-001, RULE-002]
dependencies: []
tags: [jugabilidad, camara, bots]
---

# WRK-PLAN-006 — Cuenta atrás y bots tras la segunda prueba

## Approach

Son cuatro tareas en serie, porque comparten `host.ts`, `ui.ts` o `aim.ts`. 024 y 025 llegaron en un segundo mensaje del usuario. Primero los bots: es la más pequeña y deja medido el equilibrio. Después la cuenta atrás, que cambia el protocolo y la cámara. Cada una se despliega por separado y se avisa al usuario al terminar las dos.

## Estado

| Orden | Tarea | Estado | Dependencias | Entrega |
|---:|---|---|---|---|
| 1 | WRK-TASK-023 · Bots: objetivo repartido, venganza y 1-3 s | completed | — | Reparto ponderado con venganza; bots en 1-3 s |
| 2 | WRK-TASK-022 · Cuenta atrás 3, 2, 1, ¡FUEGO! con la cámara alejándose | completed | 023 | Fase `countdown`, plano general y protocolo v6 |
| 3 | WRK-TASK-024 · Munición con clic y teclado numérico | draft | — | — |
| 4 | WRK-TASK-025 · Disparo manteniendo el clic izquierdo | draft | 024 | — |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| La partida se alarga 3 s por ronda | high | low | Son unos 30 s por partida; se mide con el equilibrio |
| Pruebas E2E que esperan el impacto justo después de confirmar | medium | medium | En `?fast=1` la cuenta atrás dura 1 s; se revisan `solo` y `multiplayer` |
| Clientes con la versión anterior | low | medium | `PROTOCOL_VERSION` 6 (RULE-002) |
