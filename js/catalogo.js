// Lógica pura del hub: qué juegos se ven y en qué orden.
// Sin DOM ni localStorage: se prueba con  node tests/catalogo.test.js
// Funciona como script clásico (window.Catalogo) y como módulo de Node.
(function (raiz) {
  "use strict";

  const TIPOS = { online: "Online", "en-persona": "En persona", app: "Herramienta" };
  const ESTADOS = ["disponible", "proximamente"];

  // Lee la parte "?..." de la URL.
  //   ?abrir=cah        → { modo: "abrir", id: "cah" }
  //   ?todos            → { modo: "todos" }
  //   ?juegos=cah,uno   → { modo: "lista", ids: ["cah", "uno"] }
  //   (nada)            → { modo: null }
  function leerParams(search) {
    const p = new URLSearchParams(search || "");
    // ?abrir=cah lo usan los accesos directos del ícono: va directo a ese juego.
    if (p.get("abrir")) return { modo: "abrir", id: p.get("abrir").trim().toLowerCase() };
    if (p.has("todos")) return { modo: "todos" };
    if (p.has("juegos")) {
      const ids = (p.get("juegos") || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
      return { modo: "lista", ids };
    }
    return { modo: null };
  }

  // Deja solo los ids que existen en el catálogo, sin repetir y en el orden recibido.
  function idsValidos(catalogo, ids) {
    const existen = new Set(catalogo.map(j => j.id));
    const vistos = new Set();
    return (ids || []).filter(id => {
      if (!existen.has(id) || vistos.has(id)) return false;
      vistos.add(id);
      return true;
    });
  }

  // Decide qué selección usar a partir del link y de lo guardado en el celu.
  // Devuelve { seleccion, guardar }:
  //   seleccion: lista de ids a mostrar, o null = todos
  //   guardar:   lista nueva a guardar, null = borrar lo guardado, undefined = no tocar
  function resolverSeleccion(catalogo, params, guardada) {
    if (params.modo === "todos") return { seleccion: null, guardar: null };
    if (params.modo === "lista") {
      const ids = idsValidos(catalogo, params.ids);
      // Un link con solo ids inválidos no borra lo que ya tenía la persona.
      if (ids.length) return { seleccion: ids, guardar: ids };
    }
    const g = Array.isArray(guardada) ? idsValidos(catalogo, guardada) : [];
    return { seleccion: g.length ? g : null, guardar: undefined };
  }

  // Juegos a mostrar: los de la selección (o todos), ordenados así:
  //   1. disponibles usados, del más reciente al más viejo
  //   2. disponibles sin usar, en el orden del JSON
  //   3. los "próximamente", en el orden del JSON
  function juegosVisibles(catalogo, seleccion, usos) {
    const set = seleccion ? new Set(seleccion) : null;
    const u = usos || {};
    return catalogo
      .map((j, i) => ({ j, i }))
      .filter(x => !set || set.has(x.j.id))
      .sort((a, b) => {
        const pa = a.j.estado === "proximamente" ? 1 : 0;
        const pb = b.j.estado === "proximamente" ? 1 : 0;
        if (pa !== pb) return pa - pb;
        const ua = u[a.j.id] || 0, ub = u[b.j.id] || 0;
        if (ua !== ub) return ub - ua;
        return a.i - b.i;
      })
      .map(x => x.j);
  }

  // Juego al que hay que saltar por ?abrir=, o null si no existe o no está disponible.
  function juegoParaAbrir(catalogo, params) {
    if (params.modo !== "abrir") return null;
    return catalogo.find(j => j.id === params.id && j.estado === "disponible") || null;
  }

  // Link para compartir una selección. Sin selección (todos) devuelve la base limpia.
  function linkSeleccion(base, seleccion) {
    const limpio = String(base).split("?")[0].split("#")[0];
    if (!seleccion || !seleccion.length) return limpio;
    return limpio + "?juegos=" + seleccion.join(",");
  }

  // Revisa juegos.json y devuelve la lista de problemas (vacía si está bien).
  function validarCatalogo(catalogo) {
    const errores = [];
    if (!Array.isArray(catalogo)) return ["juegos.json tiene que ser una lista [ ... ]"];
    const ids = new Set();
    catalogo.forEach((j, n) => {
      const donde = "Juego " + (n + 1) + (j && j.id ? " (" + j.id + ")" : "");
      if (!j || typeof j !== "object") { errores.push(donde + ": no es un objeto"); return; }
      if (!/^[a-z0-9-]+$/.test(j.id || "")) errores.push(donde + ": el id va en minúsculas, sin espacios ni comas");
      else if (ids.has(j.id)) errores.push(donde + ": id repetido");
      ids.add(j.id);
      if (!j.nombre) errores.push(donde + ": falta nombre");
      if (!/^https?:\/\//.test(j.url || "")) errores.push(donde + ": la url tiene que empezar con http(s)://");
      if (!TIPOS[j.tipo]) errores.push(donde + ": tipo tiene que ser " + Object.keys(TIPOS).join(", "));
      if (ESTADOS.indexOf(j.estado) < 0) errores.push(donde + ": estado tiene que ser " + ESTADOS.join(" o "));
    });
    return errores;
  }

  const api = { TIPOS, leerParams, idsValidos, resolverSeleccion, juegosVisibles, juegoParaAbrir, linkSeleccion, validarCatalogo };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else raiz.Catalogo = api;
})(typeof window !== "undefined" ? window : this);
