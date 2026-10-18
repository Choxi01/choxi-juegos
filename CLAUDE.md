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
- Diseño "la estantería" (2026-10-17): cada juego es una tapa de caja (`.caja`, canto con `box-shadow`, dibujo `.patron-*`
  desde el campo `patron`), emoji como calcomanía, letras Bricolage Grotesque (títulos) y Nunito (texto) de Google Fonts.
  El `sw.js` guarda las letras la primera vez (cache-first) para que ande offline; sin internet usa las del sistema.
  Estados de Render: lucecita por caja + una línea de resumen (`#servidores`). Estantes: juegos / herramientas (`tipo: app`).
  ↗ solo con mouse (`hover: hover`). "Próximamente" se apaga mezclando el color con gris en `app.js`, para que la faja quede a color.
- Cada juego tiene un botón "‹ Juegos" de vuelta al hub y pide pantalla completa con el primer toque en el celu
  (`client/src/VolverAlHub.tsx` en los online, `js/volver.js` en lobos y truco; mismo archivo en todos). La barra de
  navegador que Android pone al abrir un dominio fuera del `scope` del hub no se puede sacar desde el hub: por eso
  la pantalla completa la pide cada juego. En iPhone no hay pantalla completa para páginas.
- La URL de truco es `/TrucoApp/` (el repo se llama `Choxi01/TrucoApp`), no `/truco/`.

## Estado (2026-10-17)
V1 publicada, con el rediseño "la estantería". Disponibles: cah, uno, virus, flip7, monopoly, asesino, codigo (Codenames), efectos (Side Effects Choxi), expediente (Expediente Choxi, casos de homicidio), infiltrado (Infiltrado Choxi, PWA `tipo: app`), lobos, truco.
Próximamente: mazmorra (no desplegada en Render).

## Pendientes
- Habilitar `mazmorra` cuando esté desplegada (cambiar `estado` en `juegos.json` y verificar la URL) y sumarle `VolverAlHub.tsx`.
