---
name: spec-graph
description: Ejecuta la CLI del grafo de especificaciones (npm run kdd) y explica el resultado. Úsala para consultas sueltas sobre specs/ como filtrar por capa o estado, ver el contexto o el impacto de un ID, buscar huérfanas, estadísticas o generar el visor HTML.
---

# spec-graph

Ejecuta la CLI del grafo y presenta el resultado. `$ARGUMENTS` es el comando y sus opciones.

## Comando

```bash
npm run kdd -- <comando> [opciones]
# equivale a: node tools/spec-graph/spec-graph.mjs --specs specs <comando>
```

## Comandos

| Comando | Para qué |
|---|---|
| `validate` | Integridad: IDs duplicados, referencias rotas, ciclos, dependencias en desuso |
| `orphans` | Especificaciones sin enlaces |
| `stats` | Reparto por capa, dominio y confianza |
| `filter` | Filtro con Y lógico: `--layer`, `--status`, `--confidence`, `--tag`, `--axis`, `--scope`, `--format json` |
| `context <ID>` | La especificación y su vecindario (`--depth N`, por defecto 3; `--format json`) |
| `impact <ID>` | Qué se ve afectado, de forma transitiva, si cambia |
| `path <A> <B>` | Camino más corto entre dos especificaciones |
| `build --html` | `_build/graph.json` y visor interactivo en `_build/` |
| `visualize` | Diagrama Mermaid en `_build/graph.mermaid` |

Atajos del proyecto:

```bash
npm run kdd:check        # la puerta (más estricta que validate: añade huérfanos y ciclo de vida)
npm run kdd:pendientes   # tareas sin terminar y cuáles están listas
```

## Pasos

1. Lee `$ARGUMENTS`. Sin argumentos, ejecuta `stats` y `npm run kdd:pendientes`.
2. Ejecuta el comando. En Windows, con PowerShell o Git Bash, la forma `npm run kdd -- …` funciona igual.
3. Presenta la salida ordenada. Para `context` o `impact`, explica en dos o tres frases qué significan los enlaces.
4. Si `validate` falla, recomienda `/spec-validate` para el informe completo.

## Notas

- `layer` usa los nombres de la plantilla: `architecture`, `domain`, `product`, `feature`, `documentation`, `work-spec`, `work-plan`, `work-task`, y `governance` (ADR, RULE, RFC; para distinguirlos, `--type adr|rule|rfc`).
- `build` y `visualize` escriben en `_build/`, que está en `.gitignore`.
- Solo lectura. Esta skill no edita especificaciones.
