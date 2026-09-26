---
name: spec-context
description: Busca y resume las especificaciones de specs/ que importan para una tarea o una petición, y señala las lagunas. Para entender el terreno antes de planificar o de tocar código. Recibe un ID (WRK-TASK-NNN, FEAT-...) o una descripción libre.
---

# spec-context

Resumen breve, para leer antes de trabajar. `$ARGUMENTS` es un ID o una descripción.

## 1. Descubrir

Con un ID:

```bash
npm run kdd -- context <ID> --depth 2
```

Con una descripción, piensa qué capas toca y busca:

```bash
npm run kdd -- filter --status active
npm run kdd -- filter --layer feature --format json
npm run kdd -- filter --tag <tema>
```

Pistas del proyecto:

- Física, bloques, munición → `DOM-JUEGO-*`, `FEAT-*` de munición o física, `RULE-001`.
- Red, salas, anfitrión, mensajes → `ARCH-*` de red, `RULE-002`.
- Cámara, puntería, repetición, interfaz → `FEAT-CAMARA-*`, `FEAT-CONTROL-*`, `FEAT-REPLAY-*`.
- Rendimiento → `ARCH-*` de rendimiento, `RULE-004`.
- Cualquier cambio → `RULE-003` (verificación) y `DOC-OPS-002` (protocolo).

Si una búsqueda no da nada, mira también `CLAUDE.md` y los históricos (`PROMPT_asedio_loco.md`, `DECISIONES.md`, `PLAN.md`, `docs/MOVILES.md`): lo que esté ahí y no en `specs/` es una laguna.

## 2. Leer

Lee el `.md` de cada especificación relevante, no solo el frontmatter. Fíjate en Intent, Definition, criterios y confianza.

## 3. Resumir

```
## Contexto: <tarea>

### Arquitectura
- ID (confianza): lo que condiciona la tarea, en una línea.
### Reglas del juego
### Funcionalidades relacionadas
### Reglas que aplican (RULE-*)
### Trabajo en curso
- WRK-* activos o pendientes que tocan lo mismo.
### Lagunas
- Conocimiento que falta o que solo está en los históricos.
### Siguiente paso
- Qué escribir o actualizar antes de implementar (o «nada, se puede empezar»).
```

## Notas

- Si nada es relevante, dilo: es una laguna y vale como resultado.
- Para generar el prompt completo de una tarea, usa `/spec-activate`.
- Solo lectura.
