---
id: RULE-002
type: rule
layer: governance
status: active
confidence: medium
version: 1.0.1
created: 2026-09-26
updated: 2026-09-26
owner: dimas
dependencies: []
tags:
  - red
  - protocolo
  - compatibilidad
---

# RULE-002 — Todo cambio en datos compartidos entre clientes sube PROTOCOL_VERSION

## Rule

Si un cambio altera algo que dos clientes deben entender igual, debe subir `PROTOCOL_VERSION` en `shared/protocol.ts` (hoy vale **6**) en el mismo despliegue.

Cuenta como dato compartido:

- los mensajes cliente↔servidor (`shared/protocol.ts`) y los de partida (`client/src/game/net/messages.ts`: `st`, `tk`, `full`, `aim`, `in`, `hi`);
- `MatchState` y sus fases (`shared/match.ts`);
- el plano del castillo, los ids y el mapa (`shared/castle.ts`, `shared/map.ts`), porque los clientes reconstruyen los bloques por id;
- la lista y el orden de las municiones y su reparto con semilla (`shared/ammo.ts`);
- la cuantización de poses y el formato de los eventos `SimEvent`.

## Scope

Todo `shared/`, `server/` y `client/src/game/net/`, más cualquier dato que viaje por `relay` o que anfitrión y clientes calculen por separado con la misma semilla. No se aplica a cambios solo locales: vista, sonido, interfaz y ajustes.

## Rationale

El servidor rechaza un `hello` con otra versión y responde «Versión antigua: recarga la página». Es la única defensa contra una pestaña abierta antes de un despliegue. Sin subir la versión, esa pestaña entraría en una sala nueva y vería castillos mal montados o fases desconocidas, sin ningún error.

Ya se ha subido por la mano de 3 municiones (etapa 1), la fase `replay` (v3), el castillo de 140 bloques (v4), `mobile` y `yield` (v5) y la fase `countdown` (v6, WRK-TASK-022).

## Enforcement

| Mechanism | Where | Blocking |
|-----------|-------|----------|
| Comprobación de versión en `hello` | `server/index.ts`, en producción | yes, para el cliente viejo |
| Pregunta «¿cambia algo compartido?» al cerrar la tarea | Revisión (DOC-OPS-002) | no |

Ninguna prueba automática detecta un cambio de formato sin subida de versión.

## Exceptions

| Exception | Granted by | Recorded in |
|-----------|------------|-------------|
| Campo nuevo **opcional** que los clientes viejos ignoran sin romperse | dimas | `## Evidence` de la tarea, explicando por qué es compatible |

## Traceability

- Decisiones: D-058 (etapa 1), D-061 (v3), D-063 (v4), D-064, D-065 (v5).
- Código: `shared/protocol.ts` (`PROTOCOL_VERSION`), `server/index.ts` (comprobación en `hello`), `client/src/net/connection.ts`.
