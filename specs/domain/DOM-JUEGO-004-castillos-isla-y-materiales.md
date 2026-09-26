---
id: DOM-JUEGO-004
type: spec
layer: domain
domain: juego
status: active
confidence: medium
version: 1.0.0
created: 2026-09-26
updated: 2026-09-26
owner: dimas
dependencies: []
tags:
  - castillo
  - isla
  - materiales
  - fisica
---

# DOM-JUEGO-004 — Castillos, isla y materiales

## Intent

Describe el terreno de juego: la isla, dónde va cada castillo, de qué está hecho y cómo se rompe cada material. Es lo que hace que el destrozo salga de la física y no de una barra de vida, y lo que decide cuánto aguanta un castillo.

## Definition

### Concept

La **isla** es un cuadrado redondeado sobre un mar de lava. En cada esquina (hueco 0-3) hay un **castillo** de bloques con física real, unidos en parte por uniones rompibles, y en su centro un **rey**. Cada bloque es de un **material** con densidad, fricción y resistencia propias.

### Rules

1. **Isla:** 68 × 68 m (`ISLAND_HALF = 34`), esquinas redondeadas de 10 m de radio, superficie en y = 0.
2. **Huecos:** los castillos están a ±22 m del centro en cada eje. Hueco 0 = (−x, −z), 1 = (+x, −z), 2 = (+x, +z), 3 = (−x, +z). La fachada (+z local) mira al centro.
3. **Zona del castillo:** un cuadrado de 5,6 m de semilado (con los contrafuertes). Se usa para saber si el rey está «fuera» (DOM-JUEGO-001).
4. **Catapulta:** en un bastión estático delante de la fachada, en (0; 1,5; 7,4) local; el disparo sale 1,9 m por encima. No se cae con la muralla (D-008).
5. **Castillo:** 140 bloques a escala 1,2 (bloque base de 1,2 m):
   - 4 torres de 5 bloques (3 de piedra y 2 de madera) con 4 almenas de piedra cada una;
   - 4 murallas de 4 hileras de 5 bloques: 3 de piedra y una pasarela de madera arriba, con una ventana de cristal en la 3.ª hilera, un portón de hierro en la base de la fachada y dos refuerzos de hierro en la muralla trasera;
   - 2 contrafuertes laterales de 4 bloques (2 de piedra y 2 de madera) y una almena;
   - un torreón: pedestal de piedra 2 × 2 × 2, placa de hierro, jaula de 4 cristales y tejado de madera.
   - En total: 95 de piedra, 33 de madera, 8 de cristal y 4 de hierro.
6. **Uniones rompibles:** entre los bloques de cada torre y sus almenas, en la pasarela de las murallas, en los contrafuertes y en el torreón. Una unión se rompe si la fuerza supera su resistencia o si sus anclajes se separan más de 7 cm.
7. **Rey:** cápsula de 0,3 m de radio sobre el pedestal (a 2,76 m), dentro de la jaula de cristal. Muere aplastado con una fuerza de contacto de más de 600; entre 270 y 600 acumula daño `(f/600)² · 0,35`; cada explosión le suma `impulso/40`. Muere al llegar a 1.
8. **Materiales:**

   | Material | Densidad | Fricción | Rotura (fuerza) | Resistencia a explosión | Se funde en | Trozos |
   |---|---|---|---|---|---|---|
   | Madera | 0,6 | 0,7 | 420 | 14 | 1,2 s | astillas |
   | Piedra | 2,4 | 0,85 | 850 | 36 | 2,6 s | cascotes |
   | Cristal | 2,5 | 0,35 | 150 | 4 | 0,8 s | esquirlas |
   | Hierro | 7,8 | 0,55 | 4200 | 120 | 4 s | placas |

9. **Rotura por golpe:** un bloque se fractura si la fuerza de contacto supera su umbral. Por encima del 45 % acumula daño `(f/umbral)² · 0,4` y se fractura al llegar a 1. Solo cuenta si los cuerpos chocaban a más de 0,7 m/s, salvo aplastamientos de más de 3 veces el umbral: una carga en reposo no rompe (D-010).
10. **Rotura por explosión:** daño = impulso / resistencia a explosión. Si llega a 1 se fractura; si no, acumula el 60 %. Un bloque grueso entre la explosión y el objetivo lo protege (se queda el 35 % del impulso; el 80 % si es cristal).
11. **Daño visible:** el bloque se oscurece cada vez que su daño sube un escalón de 0,2.
12. **Fractura:** el bloque desaparece de la simulación oficial y se convierte en trozos decorativos según su material, simulados en cada cliente sin sincronizar, que se retiran a los 3-5 s (tope de 90, 170 o 260 según la calidad).
13. Ids: bloques `hueco · 200 + 1 + i`, reyes `1000 + hueco`.

### Constraints

- 4 castillos suman 560 bloques. El paso de física en la escena más cargada cuesta unos 5 ms (RULE-004, ARCH-005).
- La especificación original sugería 80-120 bloques por castillo; se amplió a 140 por decisión del usuario (D-063).

### Examples

- El mismo impacto rompe el cristal y deja la piedra entera (escena `glass`).
- Una torre a la que se le quita la base se derrumba (escena `tower`).
- Borde: una torre de piedra en reposo con 4 bloques encima no se rompe aunque la fuerza de contacto sea alta: no hay velocidad relativa.
- Contraejemplo: el imán apenas mueve la piedra (3 % de su fuerza); solo arranca los 4 bloques de hierro y lo que cae con ellos.

## Acceptance Criteria

- [x] Un pedrusco rápido no atraviesa un muro fino.
- [x] Una torre sin base se derrumba.
- [x] El cristal se rompe antes que la piedra con el mismo impacto.
- [x] Un bloque fracturado genera fragmentos que luego se retiran.
- [ ] Una prueba comprueba que el castillo tiene 140 bloques con el reparto de materiales de la regla 5.

## Evidence

| Type | Reference | Date | Confidence impact |
|------|-----------|------|-------------------|
| Testing | `tests/unit/physics.test.ts` y `tests/e2e/physics.spec.ts` (escenas `ccd`, `tower`, `glass`, `fragments`) | 2026-09-26 | low → medium |
| Testing | `tests/balance/destrozo.txt`: 8,8 bloques rotos por disparo de media | 2026-09-26 | — |

## Traceability

| Relation | Target | Description |
|----------|--------|-------------|
| Implemented in | `shared/map.ts` | Isla, huecos, zona del castillo, catapulta |
| Implemented in | `shared/castle.ts` | Plano de 140 bloques, uniones, rey, ids |
| Implemented in | `shared/materials.ts` | Propiedades de los materiales, `CHIP_RATIO` |
| Implemented in | `client/src/game/sim/sim.ts` | Rotura, explosiones, `JOINT_STRAIN`, `KING_CRUSH_FORCE` |
| Implemented in | `shared/fracture.ts`, `client/src/game/sim/debris.ts` | Troceo y fragmentos |
| Tested by | `tests/unit/physics.test.ts` | Escenas de física |
| Decided in | D-008, D-009, D-010, D-014, D-016, D-017, D-047, D-063 | Bastión, fragmentos, golpes y cargas, uniones, umbrales, CCD, castillos mayores |

## Open Questions

- La CCD no es la que impide atravesar el muro con Rapier 0.20 (D-047): la escena lo comprueba, pero no demuestra la CCD.
