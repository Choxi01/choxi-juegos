// Pantalla del hub: arma las tarjetas, despierta los servidores de Render,
// guarda la selección y el último uso, y maneja la instalación.
(function () {
  "use strict";
  const C = window.Catalogo;
  const $ = id => document.getElementById(id);

  // localStorage con prefijo propio: el dominio choxi01.github.io es compartido con lobos y truco.
  const PREFIJO = "choxihub:";
  const guardado = {
    leer(k, def) {
      try { const v = localStorage.getItem(PREFIJO + k); return v == null ? def : JSON.parse(v); }
      catch (e) { return def; }
    },
    escribir(k, v) {
      try { if (v == null) localStorage.removeItem(PREFIJO + k); else localStorage.setItem(PREFIJO + k, JSON.stringify(v)); }
      catch (e) { /* modo privado: seguimos sin guardar */ }
    },
  };

  const PING_LIMITE_MS = 90000; // si en 90 s no contestó, lo damos por caído
  const AVISO_MS = 1400;        // cuánto se ve el aviso antes de abrir un juego dormido

  let catalogo = [];
  let marca = {};
  let seleccion = null;  // null = todos
  const despertar = {};  // id → "despertando" | "listo" | "error"

  // ---------- Arranque ----------
  async function iniciar() {
    try {
      const [m, j] = await Promise.all([pedirJson("marca.json").catch(() => ({})), pedirJson("juegos.json")]);
      marca = m; catalogo = j;
    } catch (e) {
      mostrarError("No pude cargar la lista de juegos. Revisá la conexión y volvé a abrir.");
      return;
    }
    const errores = C.validarCatalogo(catalogo);
    if (errores.length) console.warn("juegos.json tiene problemas:\n" + errores.join("\n"));

    const params = C.leerParams(location.search);
    const directo = C.juegoParaAbrir(catalogo, params);
    if (directo) { marcarUso(directo.id); location.replace(directo.url); return; }

    aplicarMarca();
    const r = C.resolverSeleccion(catalogo, params, guardado.leer("seleccion", null));
    seleccion = r.seleccion;
    if (r.guardar !== undefined) guardado.escribir("seleccion", r.guardar);
    // Limpia ?juegos= / ?todos de la barra: lo elegido ya quedó guardado.
    if (location.search) history.replaceState(null, "", location.pathname + location.hash);

    despertarServidores();
    render();
  }

  function pedirJson(ruta) {
    return fetch(ruta, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(ruta); return r.json(); });
  }

  function aplicarMarca() {
    if (marca.nombre) { $("nombre").textContent = marca.nombre; document.title = marca.nombre; }
    if (marca.titulo) $("titulo").textContent = marca.titulo;
    $("subtitulo").textContent = marca.subtitulo || "";
  }

  // ---------- Despertar Render ----------
  // Los servidores gratis de Render duermen y tardan ~50 s en arrancar. Un pedido "no-cors"
  // alcanza para despertarlos: no podemos leer la respuesta, pero si vuelve es que ya está andando.
  function despertarServidores() {
    visibles().forEach(j => {
      if (!duerme(j) || despertar[j.id]) return;
      despertar[j.id] = "despertando";
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), PING_LIMITE_MS);
      fetch(j.url, { mode: "no-cors", cache: "no-store", signal: ctrl.signal })
        .then(() => { despertar[j.id] = "listo"; })
        .catch(() => { despertar[j.id] = "error"; })
        .finally(() => { clearTimeout(t); pintarEstado(j.id); });
    });
  }

  // Las herramientas (GitHub Pages) nunca duermen; los juegos con servidor sí.
  const duerme = j => j.estado === "disponible" && j.tipo !== "app";

  const ESTADOS = { despertando: "despertando…", listo: "listo", error: "no responde" };

  // Cada caja online tiene una lucecita; el texto completo va en una sola línea arriba.
  function pintarEstado(id) {
    const el = document.querySelector('[data-estado="' + id + '"]');
    const e = ESTADOS[despertar[id]];
    if (el && e) {
      el.className = "luz luz-" + despertar[id];
      el.title = "Servidor: " + e;
      el.setAttribute("aria-label", "Servidor " + e);
    }
    pintarResumen();
  }

  function pintarResumen() {
    const ids = visibles().filter(duerme).map(j => j.id);
    const el = $("servidores");
    if (!ids.length) { el.hidden = true; return; }
    const cuenta = { despertando: 0, listo: 0, error: 0 };
    ids.forEach(id => { if (cuenta[despertar[id]] != null) cuenta[despertar[id]]++; });
    let clase, texto;
    if (cuenta.despertando) {
      clase = "despertando";
      texto = "Despertando servidores… " + cuenta.listo + " de " + ids.length + " listos";
    } else if (cuenta.error) {
      clase = "error";
      texto = cuenta.error === 1 ? "1 servidor no responde" : cuenta.error + " servidores no responden";
    } else {
      clase = "listo";
      texto = "Todos los servidores listos";
    }
    el.innerHTML = '<span class="luz luz-' + clase + '" aria-hidden="true"></span>' + esc(texto);
    el.hidden = false;
  }

  // ---------- Render ----------
  const visibles = () => C.juegosVisibles(catalogo, seleccion, guardado.leer("usos", {}));

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }

  let primeraVez = true;

  function render() {
    const lista = visibles();
    const ultimo = C.ultimoUsado(lista, guardado.leer("usos", {}));
    // Dos estantes: juegos arriba, herramientas de mesa (lobos, truco) abajo.
    const juegos = lista.filter(j => j.tipo !== "app");
    const herramientas = lista.filter(j => j.tipo === "app");
    let i = 0;
    $("grilla").innerHTML = juegos.map(j => tarjeta(j, i++, j.id === ultimo)).join("");
    $("grilla-herramientas").innerHTML = herramientas.map(j => tarjeta(j, i++, j.id === ultimo)).join("");
    $("estante-herramientas").hidden = !herramientas.length;
    $("grilla").closest(".estante").hidden = !juegos.length;
    lista.forEach(j => pintarEstado(j.id));
    pintarResumen();

    // Animación de "repartir" solo al abrir el hub, no cada vez que se reordena.
    if (primeraVez) {
      primeraVez = false;
      document.body.classList.add("repartiendo");
      setTimeout(() => document.body.classList.remove("repartiendo"), 600 + i * 55);
    }

    const f = $("filtro");
    if (seleccion) {
      f.hidden = false;
      f.innerHTML = "Mostrando " + lista.length + " de " + catalogo.length + " juegos · " +
        '<button type="button" class="link" id="ver-todos">Ver todos</button>';
      $("ver-todos").onclick = () => { seleccion = null; guardado.escribir("seleccion", null); despertarServidores(); render(); };
    } else {
      f.hidden = true;
    }
  }

  const ICONO_PERSONAS = '<svg aria-hidden="true" viewBox="0 0 16 16"><circle cx="5.5" cy="4.5" r="2.5"/><circle cx="11" cy="5" r="2"/>' +
    '<path d="M1 13c0-2.5 2-4.2 4.5-4.2S10 10.5 10 13v1H1zM10.6 8.6c2.3 0 4.4 1.4 4.4 3.9V14h-4v-1c0-1.7-.5-3.2-1.6-4.2z"/></svg>';

  function tarjeta(j, i, esUltimo) {
    const apagada = j.estado !== "disponible";
    const tipo = C.TIPOS[j.tipo] || j.tipo;
    const cuerpo =
      '<span class="sticker" aria-hidden="true">' + esc(j.emoji || "🎮") + "</span>" +
      '<span class="nombre-juego">' + esc(j.nombre) + "</span>" +
      (j.descripcion ? '<span class="desc">' + esc(j.descripcion) + "</span>" : "") +
      '<span class="pie">' +
        (j.tipo !== "app" ? '<span class="etiqueta etiqueta-' + esc(j.tipo) + '">' + esc(tipo) + "</span>" : "") +
        (j.jugadores ? '<span class="jugadores">' + ICONO_PERSONAS + " " + esc(j.jugadores) +
          '<span class="sr"> jugadores</span></span>' : "") +
        (duerme(j) ? '<span class="luz" data-estado="' + esc(j.id) + '" role="img"></span>' : "") +
      "</span>" +
      (apagada ? '<span class="cinta"><span>Próximamente</span></span>' : "");

    // "Próximamente" llega con el color mezclado con gris: la cinta de arriba sí queda a todo color.
    const color = esc(j.color || "#333");
    const estilo = ' style="--i:' + i + ";--color:" + (apagada ? "color-mix(in srgb," + color + " 30%,#5d5866)" : color) + '"';
    const clases = "caja" + (C.PATRONES.indexOf(j.patron) >= 0 ? " patron-" + j.patron : "");
    // El --i va en el <li> para escalonar la animación de entrada.
    const li = '<li style="--i:' + i + '">';
    if (apagada) {
      return li + '<div class="' + clases + ' apagada" aria-disabled="true"' + estilo + ">" + cuerpo + "</div></li>";
    }
    return li + (esUltimo ? '<span class="ultimo">Último</span>' : "") +
      '<a class="' + clases + '" href="' + esc(j.url) + '" data-abrir="' + esc(j.id) + '"' + estilo + ">" + cuerpo + "</a>" +
      '<a class="nueva-pestana" href="' + esc(j.url) + '" target="_blank" rel="noopener" data-nueva="' + esc(j.id) +
        '" title="Abrir en pestaña nueva" aria-label="Abrir ' + esc(j.nombre) + ' en pestaña nueva">↗</a>' +
      "</li>";
  }

  // ---------- Abrir un juego ----------
  function marcarUso(id) {
    const usos = guardado.leer("usos", {});
    usos[id] = Date.now();
    guardado.escribir("usos", usos);
  }

  $("principal").addEventListener("click", ev => {
    const nueva = ev.target.closest("[data-nueva]");
    if (nueva) { marcarUso(nueva.dataset.nueva); setTimeout(render, 300); return; }

    const a = ev.target.closest("[data-abrir]");
    if (!a || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.button) return; // ctrl+clic: que el navegador haga lo suyo
    ev.preventDefault();
    const id = a.dataset.abrir;
    marcarUso(id);
    // Misma pestaña: con la app instalada así no salta al navegador. Se vuelve con "atrás".
    if (despertar[id] === "despertando") {
      avisar("Puede tardar ~1 min la primera vez: el servidor se está despertando.");
      setTimeout(() => { location.href = a.href; }, AVISO_MS);
    } else {
      location.href = a.href;
    }
  });

  // Al volver con "atrás" el navegador puede mostrar la página congelada: reordenamos.
  window.addEventListener("pageshow", ev => { if (ev.persisted && catalogo.length) render(); });

  // ---------- Elegir mis juegos ----------
  $("btn-elegir").onclick = () => {
    const marcados = new Set(seleccion || catalogo.map(j => j.id));
    $("lista-elegir").innerHTML = catalogo.map(j =>
      '<label class="opcion"><input type="checkbox" value="' + esc(j.id) + '"' + (marcados.has(j.id) ? " checked" : "") + ">" +
      '<span class="emoji" aria-hidden="true">' + esc(j.emoji || "🎮") + "</span>" +
      "<span>" + esc(j.nombre) + (j.estado !== "disponible" ? ' <small>(próximamente)</small>' : "") + "</span></label>"
    ).join("");
    $("hoja-elegir").showModal();
  };

  $("marcar-todos").onclick = () => {
    $("lista-elegir").querySelectorAll("input").forEach(i => { i.checked = true; });
  };

  $("hoja-elegir").addEventListener("close", () => {
    if ($("hoja-elegir").returnValue !== "guardar") return;
    const ids = Array.from($("lista-elegir").querySelectorAll("input:checked")).map(i => i.value);
    if (!ids.length) { avisar("Elegí al menos un juego. Dejo todos a la vista."); return; }
    seleccion = ids.length === catalogo.length ? null : ids;
    guardado.escribir("seleccion", seleccion);
    despertarServidores();
    render();
  });

  // ---------- Compartir ----------
  $("btn-compartir").onclick = async () => {
    const base = new URL("./", location.href).href;
    const url = C.linkSeleccion(base, seleccion);
    const titulo = marca.nombre || "Choxi Juegos";
    if (navigator.share) {
      try { await navigator.share({ title: titulo, text: "Mis juegos para jugar online:", url }); return; }
      catch (e) { if (e.name === "AbortError") return; }
    }
    try {
      await navigator.clipboard.writeText(url);
      avisar(seleccion ? "Link copiado: muestra solo tus " + seleccion.length + " juegos." : "Link copiado.");
    } catch (e) {
      window.prompt("Copiá este link:", url);
    }
  };

  // ---------- Avisos ----------
  let timerAviso;
  function avisar(texto) {
    const el = $("aviso");
    el.textContent = texto;
    el.hidden = false;
    clearTimeout(timerAviso);
    timerAviso = setTimeout(() => { el.hidden = true; }, 3500);
  }

  function mostrarError(texto) {
    $("error").textContent = texto;
    $("error").hidden = false;
  }

  // ---------- Instalar ----------
  let pedidoInstalar = null;
  window.addEventListener("beforeinstallprompt", ev => {
    ev.preventDefault();
    pedidoInstalar = ev;
    $("btn-instalar").hidden = false;
  });
  $("btn-instalar").onclick = async () => {
    if (!pedidoInstalar) return;
    pedidoInstalar.prompt();
    await pedidoInstalar.userChoice.catch(() => null);
    pedidoInstalar = null;
    $("btn-instalar").hidden = true;
  };
  window.addEventListener("appinstalled", () => { $("btn-instalar").hidden = true; });

  const esIphone = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const instalada = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  if (esIphone && !instalada && !guardado.leer("ios-cerrado", false)) $("cartel-ios").hidden = false;
  $("cerrar-ios").onclick = () => { $("cartel-ios").hidden = true; guardado.escribir("ios-cerrado", true); };

  // ---------- Offline ----------
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  iniciar();
})();
