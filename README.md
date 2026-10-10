# Choxi Juegos

El **lanzador** de todos mis juegos: una app instalable (PWA) con una tarjeta por juego.
Tocás una y te lleva al juego. Uso privado con amigos, no comercial.

👉 **https://choxi01.github.io/choxi-juegos/**

Cada juego sigue siendo su propia app, con su repo y su deploy: el hub solo los enlaza.
Si alguien quiere un solo juego, lo instala directo desde la URL de ese juego, como siempre.

## Qué hace
- **Grilla de juegos**: dos columnas en el celu, más en la compu. Modo oscuro según el sistema.
- **Despierta los servidores de Render**: al abrir el hub manda un pedido silencioso a cada juego online.
  Cada tarjeta muestra ⏳ *despertando…*, 🟢 *listo* o 🔴 *no responde*. Si tocás uno que todavía se está
  despertando, avisa "Puede tardar ~1 min la primera vez" y lo abre igual.
- **Abre en la misma pestaña** (así, con la app instalada, no salta al navegador). Se vuelve con *atrás*.
  En cada tarjeta hay un botoncito ↗ para abrir en pestaña nueva (cómodo en la compu).
- **Orden**: primero los últimos que abriste en ese celu, después el orden de `juegos.json`.
  Los "próximamente" van al final, en gris y sin poder tocarlos.
- **Accesos directos**: en Android, mantené apretado el ícono instalado → CAH, UNO, Flip 7 y Choxipolio.

## Cada uno elige sus juegos
- Por defecto se ven todos.
- **Elegir mis juegos**: tildás los que usás. Queda guardado en ese celu.
- **Links por persona**: `https://choxi01.github.io/choxi-juegos/?juegos=cah,uno,flip7`
  muestra solo esos y guarda esa selección en el celu de quien lo abre. Los ids que no existen se ignoran.
- **Compartir esta selección**: arma ese link con lo que estás viendo y lo comparte (o lo copia).
- `?todos` borra la selección y vuelve a mostrar todo.

Ids actuales: `cah`, `uno`, `virus`, `flip7`, `monopoly`, `asesino`, `codigo`, `efectos`, `mazmorra`, `expediente`, `lobos`, `truco`.

## Agregar o cambiar un juego
Todo está en [`juegos.json`](juegos.json): una entrada por juego, sin tocar código.

```json
{ "id": "cah", "nombre": "Cartas Contra la Humanidad", "emoji": "🃏",
  "descripcion": "Completá la frase más bizarra", "jugadores": "4–8",
  "tipo": "online", "url": "https://cah-choxi.onrender.com",
  "estado": "disponible", "color": "#1b1b1f" }
```

- `id`: minúsculas, sin espacios ni comas (es lo que va en los links `?juegos=`).
- `tipo`: `online` (servidor en Render, se despierta solo), `en-persona` o `app` (herramienta en GitHub Pages).
- `estado`: `disponible` o `proximamente` (gris, no se puede tocar).
- `color`: fondo de la tarjeta.

Después: `npm test` (revisa que el JSON esté bien), commit y push. GitHub Pages publica en 1–2 minutos
y el celu toma la lista nueva la próxima vez que abre el hub con internet.

El nombre y los títulos de la pantalla están en [`marca.json`](marca.json).

## Instalarlo
- **Android / compu (Chrome, Edge)**: tocá el botón **Instalar** que aparece arriba, o el menú del navegador → *Instalar app*.
- **iPhone (Safari)**: *Compartir* ⬆️ → *Agregar a inicio*. La app muestra un cartelito con estos pasos.

## Correr en local
Hace falta un servidor (la app lee `juegos.json` con `fetch`, que no anda abriendo el HTML con doble clic):

```bash
python -m http.server 8765
```

y abrir http://localhost:8765/. Pruebas: `npm test` (o `node tests/catalogo.test.js`).

## Archivos
| Archivo | Qué tiene |
|---|---|
| `index.html`, `css/estilos.css` | Pantalla |
| `js/catalogo.js` | Lógica pura: links, selección, orden, validación del JSON |
| `js/app.js` | Tarjetas, pings, guardado, compartir, instalar |
| `sw.js` | Offline: abre sin internet; `juegos.json` y el código se buscan primero en internet |
| `manifest.webmanifest`, `icons/` | Instalación como app (íconos propios, `icons/icono.svg` es el original) |

## Limitaciones
- Los servidores gratis de Render duermen a los ~15 min sin uso y tardan ~50 s en despertar.
- El 🟢 "listo" significa que el servidor contestó, no que el juego ande perfecto.
- La selección y el último uso se guardan en cada navegador: no se sincronizan entre celus.
- Los accesos directos del ícono solo existen en Android (y en Chrome/Edge de la compu).
