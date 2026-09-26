# Especificaciones (KDD)

`specs/` es la fuente de verdad de lo que el juego hace, cómo está construido, qué se ha decidido y qué trabajo hay en marcha. El protocolo para trabajar con ellas está en `DOC-OPS-002` y las instrucciones para el agente, en `AGENTS.md`.

## Ejes y carpetas

| Carpeta | Artefactos | Qué dicen |
|---|---|---|
| `architecture/` | `ARCH-NNN` | Cómo está construido: plataforma, capas, red, física, rendimiento |
| `domain/` | `DOM-JUEGO-NNN` | Las reglas del juego, que no dependen de cómo se programen |
| `product/` | `PROD-JUGAR-NNN` | El recorrido del jugador |
| `feature/` | `FEAT-MODULO-NNN` | Cada funcionalidad: entradas, comportamiento, salidas y límites conocidos |
| `documentation/` | `DOC-OPS-NNN` | Pruebas, herramientas y el protocolo de trabajo |
| `governance/` | `ADR-NNN`, `RULE-NNN`, `RFC-NNN` | Decisiones que siguen vigentes y reglas que se cumplen siempre |
| `work/` | `WRK-SPEC-NNN` → `WRK-PLAN-NNN` → `WRK-TASK-NNN` | El trabajo: qué se cambia, en qué orden y con qué evidencia |

## Convenciones

- **Idioma:** el contenido va en español, con el estilo del resto del proyecto (frases cortas, sin jerga innecesaria). Los títulos de sección son los de las plantillas (`## Intent`, `## Evidence`…), en inglés, porque las herramientas los buscan.
- **Plantillas:** cada especificación empieza desde `templates/`. En las de conocimiento solo se deja el bloque de subsecciones de su capa.
- **Nombre de archivo:** `<ID>-<titulo-en-kebab-case>.md`, sin tildes ni eñes.
- **IDs permanentes:** nunca se renumeran. Una especificación que deja de valer pasa a `deprecated` y la nueva la declara en `supersedes:`.
- **`owner: dimas`.** Las fechas, `AAAA-MM-DD`.
- **Versiones:** semver. Parche para redacción, menor para contenido añadido, mayor si cambia una regla.
- **Dependencias** (`dependencies:` con `{id, relation}`) solo entre especificaciones. El código, las pruebas y las decisiones antiguas (`D-0NN` de `DECISIONES.md`) van en `## Traceability`.
- **Confianza:** `high` si hay pruebas automáticas **y** el usuario lo ha validado jugando; `medium` si hay una de las dos; `low` si se deduce del código o es una propuesta.
- **Cortas.** Una especificación útil de 60 líneas vale más que una de 300. Lo que se ve claro en el código no hace falta repetirlo; se especifica lo que sorprende, lo que se rompe o lo que cruza módulos.
- **Sin inventar.** Lo que no se sabe va a `## Open Questions`.

## Estados

| Artefacto | Ciclo |
|---|---|
| Conocimiento (ARCH, DOM, PROD, FEAT, DOC) | `draft → active → deprecated` |
| Trabajo (WRK-*) | `draft → active → completed → archived` |
| ADR | `proposed → accepted → deprecated \| superseded` |
| RULE | `active → deprecated` |

Una tarea `completed` o `archived` tiene todos sus criterios marcados (`- [x]`) y una sección `## Evidence` con commits, pruebas y fecha. Solo hay una `WRK-TASK` activa por copia de trabajo, y una tarea activa declara `## File Scope`.

## Comandos

```bash
npm run kdd -- validate            # integridad del grafo
npm run kdd -- context WRK-TASK-006 # contexto de una tarea: lo que activa y de qué depende
npm run kdd -- impact ARCH-003     # qué se ve afectado si cambia una especificación
npm run kdd -- build --html        # grafo interactivo en _build/
npm run kdd:check                  # la puerta: grafo, huérfanos y ciclo de vida
npm run kdd:pendientes             # tareas pendientes y cuáles están listas para empezar
```

## Documentos anteriores

`PROMPT_asedio_loco.md` (la especificación original), `PLAN.md`, `DECISIONES.md` y `docs/MOVILES.md` se conservan como histórico. Las especificaciones los citan en `## Traceability`, pero ya no se actualizan.
