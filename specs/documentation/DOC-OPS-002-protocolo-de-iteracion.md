---
id: DOC-OPS-002
type: spec
layer: documentation
scope: persistent
status: active
confidence: low
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
dependencies:
  - id: DOC-OPS-001
    relation: extends
  - id: RULE-001
    relation: constrained-by
  - id: RULE-002
    relation: constrained-by
  - id: RULE-003
    relation: constrained-by
  - id: RULE-004
    relation: constrained-by
tags: [proceso, kdd, agentes, iteracion]
---

# DOC-OPS-002 — Protocolo de iteración

## Intent

Cómo se convierte una petición en trabajo terminado y en producción, sin perder la agilidad con la que nació el proyecto y sabiendo en todo momento qué está hecho y qué falta. Adapta el protocolo de `rag-docs` a un proyecto de una persona que despliega directamente desde `main`.

## Definition

### Purpose

Que cualquier sesión, humana o de agente, pueda contestar tres preguntas mirando solo `specs/`: qué hace el juego, qué se está cambiando y qué queda pendiente.

### Audience

El agente que trabaja en el repo y el usuario, que pide mejoras tras probar el juego.

### Content outline

#### 1. De la petición al plan

- El usuario pide mejoras en lenguaje natural, a menudo varias a la vez y tras probar el juego.
- El agente las convierte en un `WRK-SPEC` (qué y por qué, con las decisiones del usuario), un `WRK-PLAN` (etapas y orden) y una `WRK-TASK` por etapa. Las tareas activan las especificaciones de conocimiento que las condicionan (`activates`).
- **Decisiones abiertas:** si hay varias formas razonables de hacerlo, el agente las presenta como opciones con una recomendada y espera la respuesta. Con las decisiones tomadas, ejecuta las etapas sin volver a preguntar, salvo que aparezca una decisión nueva de diseño.
- Si falta conocimiento (una regla sin escribir, un módulo sin especificar), se escribe antes, a `confidence: low` si no está comprobado.

#### 2. Cambio rápido (sin WRK-TASK)

Para no burocratizar lo pequeño, no hace falta tarea si se cumplen las tres condiciones:

- es una corrección o un ajuste de menos de una hora (un texto, un valor, un fallo evidente);
- no añade comportamiento nuevo ni cambia el protocolo de red;
- no necesita una decisión del usuario.

El commit lo describe. Si cambia algo que una especificación afirma, esa especificación se actualiza en el mismo commit y sube de versión (parche o menor). Cualquier otra cosa lleva `WRK-TASK`.

#### 3. Una iteración = una WRK-TASK

1. **Elegir.** `npm run kdd:pendientes` enseña las tareas listas: todas sus dependencias están `completed` o `archived`. Se elige por este orden: el plan activo, lo que desbloquea más trabajo y lo que reduce más riesgo.
2. **Preparar.** `git pull`, árbol limpio, `npm run kdd:check` y `npm run kdd -- context WRK-TASK-NNN` para leer las especificaciones que activa.
3. **Activar.** La tarea pasa a `active`, con un `## File Scope` explícito. Solo puede haber una tarea activa por copia de trabajo, y su plan y su `WRK-SPEC` también deben estar `active`.
4. **Implementar** dentro del File Scope y contra los criterios de aceptación. Si el código contradice una especificación, se anota como hallazgo; no se esquiva en silencio.
5. **Verificar** según `RULE-003`: `npm run verify` (KDD, tipos y unitarios) y las E2E locales proporcionales al cambio. Si toca física o munición, `RULE-001`; si toca mensajes o estado compartido, `RULE-002`; si puede costar rendimiento, `RULE-004`. Si cambia algo visible, capturas con `node tests/tools/review.mjs`.
6. **Consolidar** en el mismo commit o en el siguiente:
   - criterios marcados `- [x]` y `## Evidence` con commits, pruebas y fecha;
   - especificaciones de conocimiento afectadas al día (con su versión subida y la tarea citada en `## Evidence`);
   - cada decisión nueva que condicione el futuro, en un ADR;
   - la tabla de estado del `WRK-PLAN` actualizada y la tarea en `completed`.
7. **Publicar.** Commits pequeños en español, push a `main` y `npm run ci:estado -- --wait`. La iteración acaba con CI en verde. Si CI falla, se arregla antes de seguir; si no se puede arreglar, se revierte (`RULE-003`).

#### 4. Trabajo descubierto

- Lo que es necesario para el objetivo y cabe en el File Scope se hace en la tarea actual.
- Lo que se puede separar recibe el siguiente número de `WRK-TASK`, con padre, dependencias, activaciones, File Scope y criterios, y se añade al plan antes de ejecutarlo.
- Si es un requisito previo, pasa a ser la tarea siguiente.
- Los fallos o limitaciones que no pertenecen a ningún plan van a `WRK-PLAN-005` (pendientes conocidos).

#### 5. Orquestación con subagentes

- Se usan subagentes cuando reducen el tiempo sin provocar ediciones en conflicto:
  - análisis de solo lectura en paralelo (el agente `Explore`, o varios a la vez sobre áreas distintas);
  - redacción de especificaciones en archivos distintos;
  - revisión de una especificación o de un cambio (el agente `spec-validator` o `/code-review`);
  - mediciones largas en segundo plano (equilibrio, destrozo, banco de rendimiento).
- El agente principal se queda con la síntesis, los archivos compartidos (`CLAUDE.md`, los planes y `package.json`), la integración, las puertas y el resultado final.
- **Dos tareas a la vez**, como mucho, y solo si el usuario autoriza trabajo múltiple, ninguna depende de la otra y sus File Scope no se solapan. Cada una va en su propio worktree y su propia rama, y se integran en `main` de una en una: la segunda se actualiza desde el nuevo `main` y repite las puertas antes de integrarse. Ante cualquier duda, se hacen en serie.

#### 6. Entregas y cierre

- Una entrega es un `WRK-SPEC` con su `WRK-PLAN`. `/release-loop` ejecuta sus tareas en serie y se para en un punto seguro según el presupuesto (`npm run budget`).
- Al terminar la última tarea, `/spec-consolidate WRK-SPEC-NNN`:
  - las especificaciones de conocimiento quedan al día y suben de confianza con la evidencia;
  - `WRK-SPEC` y `WRK-PLAN` pasan a `completed` y, cuando el usuario lo haya probado, a `archived` junto con sus tareas;
  - se avisa al usuario con capturas y lo que debe probar.

## Acceptance Criteria

- [x] `npm run kdd:check` valida grafo, huérfanos y ciclo de vida, y CI lo ejecuta antes de desplegar.
- [x] `npm run kdd:pendientes` lista las tareas sin terminar y distingue las que están listas.
- [ ] Cada cambio que no es un cambio rápido tiene una `WRK-TASK` con File Scope, criterios y Evidence.
- [ ] Cada entrega cerrada deja las especificaciones de conocimiento al día y el plan con su tabla de estado final.
- [ ] Nunca hay más de una `WRK-TASK` activa por copia de trabajo.

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Adaptación | Protocolo de `rag-docs` (`DOC-RAG-002`), sin la PR por tarea | 2026-09-26 | — (low hasta usarlo en una entrega real) |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `scripts/kdd.mjs` | Puerta (`check`) y lista de pendientes |
| Implemented in | `.github/workflows/deploy.yml` | `npm run kdd:check` antes de desplegar |
| Implemented in | `.claude/skills/release-loop/SKILL.md` | Ejecución en serie de una entrega |
| Implemented in | `AGENTS.md` | Resumen de este protocolo para el agente |
| Decided in | ADR de adopción de KDD | Por qué y cómo se adoptó |
