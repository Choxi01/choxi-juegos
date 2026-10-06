# Choxi Juegos (hub) — notas para Claude Code

Lanzador PWA de todos los juegos Choxi. **Tipo B** de la skill `juego-online-choxi`: HTML + CSS + JS clásico
(no módulos ES), sin build ni dependencias, publicado con GitHub Pages desde `main` (raíz):
https://choxi01.github.io/choxi-juegos/ — Todo en español rioplatense con voseo.

## Cómo trabajar
1. `git pull`. 2. Cambiar. 3. `npm test` (prueba la lógica y valida `juegos.json`).
4. Si se agrega un archivo, sumarlo a `ARCHIVOS` en `sw.js`. 5. Commit corto en español, en presente. 6. `git push`.

## Decisiones
- El hub **solo enlaza**: no toca los repos de los juegos. Sin iframes (cada juego tiene su Socket.IO y su PWA).
- Abre en la misma pestaña (`location.href`) para que la app instalada no salte al navegador; ↗ abre en pestaña nueva.
- `localStorage` con prefijo `choxihub:` (`seleccion`, `usos`, `ios-cerrado`): el dominio se comparte con lobos y truco.
  La caché del service worker se llama `choxihub` y solo borra las suyas.
- Pings `no-cors` a los juegos que no son `app` y están disponibles; timeout 90 s → 🔴.
- Los `shortcuts` del manifest apuntan a `./?abrir=<id>` (Chrome ignora atajos fuera del `scope`) y `app.js` redirige.
- Orden: disponibles usados (más reciente primero) → disponibles sin usar (orden del JSON) → próximamente.
- Un link `?juegos=` con solo ids inválidos no pisa la selección guardada. Elegir todos = sin selección.
- La URL de truco es `/TrucoApp/` (el repo se llama `Choxi01/TrucoApp`), no `/truco/`.

## Estado (2026-10-05)
V1 publicada. Disponibles: cah, uno, virus, flip7, monopoly, lobos, truco.
Próximamente: asesino (el servidor ya responde, falta decidir si se habilita), mazmorra (no desplegada en Render).

## Pendientes
- Habilitar `asesino` y `mazmorra` cuando estén listos (cambiar `estado` en `juegos.json`).
- Link de vuelta al hub dentro de cada juego (cambio en cada repo; fuera de alcance por ahora).
