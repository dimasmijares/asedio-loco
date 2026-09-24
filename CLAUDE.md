# CLAUDE.md — guía para el agente

La especificación completa del proyecto está en `PROMPT_asedio_loco.md`. Las desviaciones respecto a ella se registran en `DECISIONES.md`.

## Estado actual

- **Fase 0 (preparación)** en curso.
  - [x] 0.1 Entorno: Node 22 LTS, npm 10, git, gh, Playwright 1.63 + Chromium. WebGL2 sin interfaz verificado con SwiftShader.
  - [x] 0.2 Repo de GitHub `dimasmijares/asedio-loco` (público).
  - [x] 0.3 Servidor de salas: Cloudflare Workers + Durable Objects (cuenta con subdominio `dimasmijares.workers.dev`, wrangler con sesión)
  - [x] 0.4 Cliente: archivos estáticos del mismo Worker. Página, `/api/health` y WebSocket de eco verificados en producción
  - [ ] 0.5 Despliegue continuo
  - [ ] 0.6 Esqueleto desplegado
  - [ ] 0.7 Confirmación final

## Arquitectura

_Pendiente._

## Protocolo de mensajes

_Pendiente._

## Pruebas

- Playwright en Chromium sin interfaz necesita estos flags para WebGL: `--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.

## Notas del entorno

- Windows 11, la carpeta del proyecto está dentro de OneDrive. Si aparecen errores `EPERM`/`EBUSY` en `node_modules` o `dist`, la causa probable es la sincronización.
- Commits en español, pequeños y descriptivos. Nunca subir secretos ni `.env`.
