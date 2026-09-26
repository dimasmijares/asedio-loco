---
name: spec-create
description: Crea de una vez una especificación en specs/ a partir de una descripción (capa, siguiente ID libre, plantilla, enlaces sugeridos) y la deja en draft. Para algo rápido y sin conversación; para redactar con cuidado o planificar una entrega entera, usa el agente spec-writer.
---

# spec-create

`$ARGUMENTS`: descripción libre, p. ej. «regla del juego para la subida de la lava» o «ADR: rondas de 20 s».

## 1. Clasificar

| Si describe… | Capa | ID | Carpeta |
|---|---|---|---|
| Cómo está construido (plataforma, red, física, rendimiento) | architecture | `ARCH-NNN` | `specs/architecture/` |
| Una regla del juego (rondas, daño, lava, munición, victoria) | domain | `DOM-JUEGO-NNN` | `specs/domain/` |
| El recorrido del jugador (portada, sala, partida, revancha) | product | `PROD-JUGAR-NNN` | `specs/product/` |
| Una funcionalidad concreta | feature | `FEAT-MODULO-NNN` | `specs/feature/` |
| Pruebas, herramientas, protocolo | documentation | `DOC-OPS-NNN` | `specs/documentation/` |
| Una decisión tomada | governance | `ADR-NNN` | `specs/governance/` |
| Una restricción que se cumple siempre | governance | `RULE-NNN` | `specs/governance/` |
| Trabajo | work-spec / work-plan / work-task | `WRK-*-NNN` | `specs/work/` |

`MODULO` es el nombre corto de la funcionalidad en mayúsculas y sin tildes (`CAMARA`, `CONTROL`, `REPLAY`…). Reutiliza uno existente si encaja. Si la capa es dudosa, pregunta.

## 2. Siguiente ID

```bash
npm run kdd -- filter --layer <capa> --format json
```

Toma el número más alto de ese prefijo y suma uno. Comprueba con Glob que no hay un archivo con ese ID. Los IDs nunca se reutilizan, aunque la especificación esté `deprecated`.

## 3. Vecinos

```bash
npm run kdd -- filter --layer architecture
npm run kdd -- filter --tag <tema>
```

- Una FEAT suele `implements` una ARCH y `constrained-by` una DOM-JUEGO o una RULE.
- Una DOM que detalla otra: `extends`.
- Trabajo: `parent` y `activates`; entre tareas, `depends-on`.

Al menos un enlace: sin él, `npm run kdd:check` falla por huérfana.

## 4. Escribir

1. Copia la plantilla de `templates/` (`knowledge-spec.md`, `adr.md`, `rule.md`, `work-*.md`). En las de conocimiento, deja solo el bloque de `## Definition` de su capa.
2. Frontmatter: `status: draft` (ADR: `proposed`), `confidence: low`, `version: 0.1.0`, `created` y `updated` de hoy, `owner: dimas`.
3. Nombre: `<ID>-<titulo-en-kebab-case>.md`, sin tildes ni eñes.
4. Si la descripción da detalle, rellena las secciones. Lo que no se sabe va a `## Open Questions`, no a `{marcadores}` inventados.
5. `## Traceability` con rutas reales (compruébalas) y, si viene de ahí, la decisión antigua `D-0NN` de `DECISIONES.md`.
6. Una tarea que vaya a activarse necesita `## File Scope`.

## 5. Comprobar y avisar

```bash
npm run kdd:check
```

```
Creada: specs/<carpeta>/<archivo>.md
ID: … · capa: … · estado: draft · confianza: low
Enlaces: <ID> (relación, motivo)
Pendiente: Open Questions, revisión del usuario
```

Una decisión nueva que condicione el futuro va siempre a un ADR, aunque la especificación de conocimiento también cambie. No hace commits.
