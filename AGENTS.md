# Instrucciones para el agente

## Fuente de verdad: `specs/`

`specs/**` dice qué hace el juego, cómo está construido, qué se ha decidido y qué trabajo hay en marcha. Las convenciones están en `specs/README.md` y el protocolo completo, en `DOC-OPS-002`. No lo repitas en las tareas.

Antes de elegir trabajo: `git pull`, árbol limpio, `npm run kdd:check` y `npm run kdd:pendientes`. Antes de implementar una tarea: `npm run kdd -- context WRK-TASK-NNN` y lee lo que activa.

## Cómo se trabaja

- **Peticiones del usuario:** se convierten en `WRK-SPEC` → `WRK-PLAN` → `WRK-TASK`. Si hay decisiones abiertas, ofrece opciones con una recomendada. Con las decisiones tomadas, ejecuta las etapas sin volver a preguntar.
- **Cambio rápido** (menos de una hora, sin comportamiento nuevo ni cambio de protocolo, sin decisiones): basta un commit, y se actualiza la especificación que lo afirme.
- **Una iteración = una WRK-TASK:** pasa a `active` con File Scope, implementa dentro de ese alcance y verifica (`npm run verify`, más las E2E proporcionales y las reglas `RULE-001`…`RULE-004` que apliquen). Después consolida (criterios, Evidence, especificaciones de conocimiento, ADR si hay una decisión nueva, tabla del plan), pasa la tarea a `completed`, sube a `main` y espera a CI en verde con `npm run ci:estado -- --wait`.
- **«Haz la siguiente tarea»** completa una tarea lista. **«Continúa la entrega»** activa `/release-loop`, que ejecuta tareas en serie y se para en un punto seguro según el presupuesto (`npm run budget`).
- **Trabajo descubierto:** si es separable, pasa a ser una `WRK-TASK` nueva en el plan. No amplíes el alcance en silencio.

## Subagentes

Úsalos cuando reduzcan tiempo sin ediciones en conflicto:
- análisis de solo lectura en paralelo (`Explore`);
- redacción de especificaciones en archivos distintos (`spec-writer`);
- revisión de especificaciones contra el código (`spec-validator`);
- mediciones largas en segundo plano.

El agente principal se queda con la síntesis, los archivos compartidos (`CLAUDE.md`, los planes y `package.json`), la integración y las puertas. Como mucho, dos tareas en paralelo: independientes, con File Scope sin solapes, cada una en su worktree, y se integran en `main` de una en una.

## Cierre

Una tarea acaba con los criterios cumplidos, Evidence escrita, `npm run kdd:check` limpio y CI en verde. Una entrega acaba con `/spec-consolidate`: el conocimiento queda al día y se avisa al usuario de qué probar, con capturas.
