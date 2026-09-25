# Asedio Loco en móviles: viabilidad y plan

Estudio de la etapa 6 de `PLAN.md` (25-09-2026). Se basa en:

- capturas del juego actual en un Pixel 7 emulado (412 × 839 en vertical y 863 × 360 en horizontal, densidad 2,6);
- las medidas de rendimiento de `CLAUDE.md`;
- cómo está hecho el código.

No he podido probar en un móvil real: las cifras de rendimiento en móvil son estimaciones y hay que confirmarlas en un teléfono (ver «Cómo comprobarlo»).

## Conclusión

**Es viable**, con tres condiciones:

1. **En horizontal.** En vertical la isla se ve diminuta y el HUD no cabe. Pedir girar el móvil es lo habitual en juegos de este tipo.
2. **Control táctil propio.** El actual necesita el clic derecho y Espacio.
3. **Perfil de rendimiento para móvil.** Además, conviene que el anfitrión de una partida en red sea un ordenador si lo hay.

Coste estimado: unas 4 etapas pequeñas o medianas, parecidas a las del plan anterior. No hace falta cambiar ni la física, ni la red, ni el servidor.

## Lo que falla hoy

| Área | Qué pasa | Gravedad |
|---|---|---|
| Control | No hay clic derecho ni Espacio. El botón de disparo sí sirve (se mantiene pulsado para cargar), pero no se puede apuntar. | Bloqueante |
| HUD en vertical | El título se parte («LOC / O»), el marcador de ronda queda debajo de la lista de jugadores y el texto de potencia ocupa dos líneas | Alta |
| HUD en horizontal | Con 360 px de alto, la lista de jugadores y el panel de controles ocupan media pantalla | Alta |
| Rendimiento del anfitrión | Cada paso de física cuesta unos 5 ms en un PC de sobremesa, en la escena más cargada. En un móvil de gama media, la CPU con WebAssembly suele ir de 2,5 a 3,5 veces más lenta: serían 12-18 ms por paso, en el límite de los 16,7 ms. Se notaría como cámara lenta en los momentos de más destrozo, no como tirones: el bucle ya limita a 4 pasos por fotograma. | Media |
| Resolución | La densidad de pantalla es 2,6. En calidad media se dibuja a 1,25 y en alta a 2, que es mucho relleno de píxeles para una GPU móvil. | Media |
| Segundo plano | Si el anfitrión cambia de app o de pestaña, el navegador deja de ejecutar `requestAnimationFrame`: la física y los envíos se paran y la partida se congela para todos. Solo se migra el anfitrión si se desconecta del todo. En el móvil pasa enseguida (una notificación, una llamada), pero también en el PC si el anfitrión cambia de pestaña. | Alta (afecta también al PC) |
| Batería y temperatura | 60 fps constantes con sombras calientan el móvil en una partida de 5 minutos | Baja-media |

## Opciones por área

### Control táctil

- **A (recomendada) · Arrastrar un dedo sobre la escena = apuntar.** Es el equivalente directo del clic derecho: horizontal, rumbo; vertical, elevación. Botón grande de disparo que se mantiene pulsado (ya existe), tocar las tarjetas para la munición (ya funciona) y dos flechas pequeñas para cambiar de castillo objetivo. Pellizcar para acercar la cámara. Coste: pequeño; todo cabe en `AimInput` con eventos `pointer` de tipo `touch`.
- **B · Joystick virtual en una esquina.** Más preciso en pantallas pequeñas, pero tapa parte de la escena y hay que diseñarlo. Coste: medio.
- **C · Tocar el punto al que quieres disparar**, y el juego calcula rumbo y elevación con `solveAim` (ya lo usan los bots). Es muy fácil, pero cambia el juego: acertar deja de tener mérito. Se podría ofrecer solo en «fácil». Coste: pequeño.

### Interfaz

- **Solo horizontal (recomendado).** En vertical, un aviso de «Gira el móvil». Con la pantalla completa (API Fullscreen) desaparece la barra del navegador y se ganan unos 60 px.
- **HUD compacto cuando la altura es menor de 500 px:**
  - la lista de jugadores pasa a estandarte, porcentaje y calavera, sin nombres;
  - el panel de controles se oculta y queda un botón «?»;
  - la potencia y la elevación van en una línea más pequeña;
  - el botón de disparo baja a la esquina derecha, al alcance del pulgar.
- **Vertical completo:** posible, pero con una cámara distinta y otra disposición del HUD. Coste medio-alto por poco beneficio. Lo dejaría fuera.

### Rendimiento

- **Perfil móvil automático:**
  - al detectar un dispositivo táctil sin ratón (`pointer: coarse`), calidad «baja» por defecto;
  - densidad de píxeles como mucho 1, y 30 fps fuera de la fase de impacto;
  - fragmentos y partículas al mínimo.
  La calidad adaptativa ya existe y baja sola si no llega a 38 fps.
- **Anfitrión preferente de escritorio.** El cliente dice en su saludo si es móvil. Al empezar la partida, si el creador de la sala es móvil y hay un ordenador en la sala, el servidor le pasa el papel de anfitrión con la migración que ya existe. Coste: pequeño.
- **En solitario en móvil**, el propio móvil hace de anfitrión: se aceptaría la cámara lenta en los picos. Si fuera demasiado, habría una opción de 3 castillos en lugar de 4 (un 25 % menos de física).

### Red y ciclo de vida

- **Ceder el anfitrión al pasar a segundo plano:** con `visibilitychange`, el anfitrión se retira en unos segundos y otro jugador hereda la partida (migración ya probada). Arregla también el caso del PC.
- **Reconexión al volver:** ya funciona con el token, así que un jugador que vuelve recupera su castillo.
- **Datos móviles:** unos 2-4 KB por tic a 15 Hz con 4 jugadores. Es poco para 4G/5G. La prueba de red mala (250 ms ±120 y 30 % de pérdida) ya cubre una conexión móvil mala.

### PWA (opcional)

Un manifiesto web para «Añadir a pantalla de inicio», con orientación horizontal fija y pantalla completa. Coste: pequeño. No hace falta tienda de aplicaciones.

## Plan propuesto

| Etapa | Contenido | Coste | Pruebas |
|---|---|---|---|
| M1 | Ceder el anfitrión al pasar a segundo plano (arregla también el PC) y anfitrión preferente de escritorio | Pequeño | E2E: el anfitrión oculta la pestaña y otro hereda la partida |
| M2 | Control táctil (opción A), pantalla completa, aviso de «Gira el móvil» y tutorial con textos táctiles | Medio | E2E con emulación táctil (`hasTouch`) de un Pixel y un iPhone: apuntar, cargar y disparar |
| M3 | HUD compacto para alturas menores de 500 px | Medio | Capturas en 3 tamaños de móvil y comprobación de que nada se solapa |
| M4 | Perfil de rendimiento móvil y límite de 30 fps fuera del impacto | Pequeño | Banco de rendimiento con la CPU frenada 4× en Chromium, y prueba en un móvil real |
| M5 (opcional) | PWA | Pequeño | Instalación en Android e iOS |

Orden recomendado: M1 primero, porque arregla un fallo que ya existe en el PC. Después M2 y M3 juntas, que son las que hacen el juego jugable en el móvil, y por último M4.

## Riesgos

- **iOS Safari:** el bloqueo de orientación y la pantalla completa funcionan peor que en Android (en iPhone la pantalla completa real solo existe como PWA). Mitigación: el aviso de «Gira el móvil» funciona siempre.
- **Móviles de gama baja:** la física de un anfitrión en solitario podría ir demasiado lenta. Mitigación: los 3 castillos, o recomendar jugar en red con un PC de anfitrión.
- **Precisión del dedo:** arrastrar en una pantalla pequeña es menos fino que el ratón. Mitigación: sensibilidad ajustable (ya existe en Ajustes) y A/D con botones de ajuste fino si hace falta.

## Cómo comprobarlo en un móvil real

1. Abrir https://asedio-loco.dimasmijares.workers.dev/?quality=low#sandbox en el móvil, en horizontal. El campo de pruebas enseña arriba a la derecha los fps y los milisegundos por fotograma. Disparar varias veces con el botón (manteniéndolo pulsado) y anotar los fps durante el derrumbe.
2. Abrir `/#solo` en horizontal y jugar dos rondas con el botón de disparo, para ver cómo va el móvil de temperatura y fluidez.
