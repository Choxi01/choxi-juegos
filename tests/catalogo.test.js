// Pruebas del catálogo. Correr con:  node tests/catalogo.test.js
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const C = require("../js/catalogo.js");

let ok = 0, fallas = 0;
function prueba(nombre, fn) {
  try { fn(); ok++; console.log("  ✓ " + nombre); }
  catch (e) { fallas++; console.log("  ✗ " + nombre + "\n    " + e.message); }
}

const cat = [
  { id: "cah", estado: "disponible" },
  { id: "uno", estado: "disponible" },
  { id: "asesino", estado: "proximamente" },
  { id: "flip7", estado: "disponible" },
  { id: "truco", estado: "disponible" },
];
const ids = lista => lista.map(j => j.id);

console.log("Parámetros del link");
prueba("sin parámetros no cambia nada", () => assert.deepEqual(C.leerParams(""), { modo: null }));
prueba("?todos", () => assert.deepEqual(C.leerParams("?todos"), { modo: "todos" }));
prueba("?juegos= con espacios y mayúsculas", () =>
  assert.deepEqual(C.leerParams("?juegos=CAH, uno,,flip7"), { modo: "lista", ids: ["cah", "uno", "flip7"] }));
prueba("?todos gana sobre ?juegos", () => assert.equal(C.leerParams("?juegos=cah&todos").modo, "todos"));

console.log("Ids válidos");
prueba("ignora ids inválidos y repetidos", () =>
  assert.deepEqual(C.idsValidos(cat, ["uno", "pepe", "uno", "cah"]), ["uno", "cah"]));

console.log("Selección");
prueba("por defecto se ven todos", () =>
  assert.deepEqual(C.resolverSeleccion(cat, { modo: null }, null), { seleccion: null, guardar: undefined }));
prueba("usa la selección guardada", () =>
  assert.deepEqual(C.resolverSeleccion(cat, { modo: null }, ["uno"]).seleccion, ["uno"]));
prueba("el link manda y se guarda", () => {
  const r = C.resolverSeleccion(cat, { modo: "lista", ids: ["flip7", "cah"] }, ["uno"]);
  assert.deepEqual(r, { seleccion: ["flip7", "cah"], guardar: ["flip7", "cah"] });
});
prueba("link con solo ids inválidos no pisa lo guardado", () => {
  const r = C.resolverSeleccion(cat, { modo: "lista", ids: ["xx"] }, ["uno"]);
  assert.deepEqual(r, { seleccion: ["uno"], guardar: undefined });
});
prueba("?todos borra lo guardado", () =>
  assert.deepEqual(C.resolverSeleccion(cat, { modo: "todos" }, ["uno"]), { seleccion: null, guardar: null }));
prueba("guardado con juegos que ya no existen", () =>
  assert.deepEqual(C.resolverSeleccion(cat, { modo: null }, ["borrado", "cah"]).seleccion, ["cah"]));
prueba("guardado roto (no es lista) = todos", () =>
  assert.equal(C.resolverSeleccion(cat, { modo: null }, "basura").seleccion, null));

console.log("Orden");
prueba("sin usos: orden del JSON y próximamente al final", () =>
  assert.deepEqual(ids(C.juegosVisibles(cat, null, {})), ["cah", "uno", "flip7", "truco", "asesino"]));
prueba("último usado primero", () =>
  assert.deepEqual(ids(C.juegosVisibles(cat, null, { truco: 100, uno: 200 })), ["uno", "truco", "cah", "flip7", "asesino"]));
prueba("filtra por selección", () =>
  assert.deepEqual(ids(C.juegosVisibles(cat, ["flip7", "cah"], { flip7: 5 })), ["flip7", "cah"]));

console.log("Accesos directos (?abrir=)");
prueba("lee ?abrir=", () => assert.deepEqual(C.leerParams("?abrir=UNO"), { modo: "abrir", id: "uno" }));
prueba("encuentra el juego", () => assert.equal(C.juegoParaAbrir(cat, { modo: "abrir", id: "flip7" }).id, "flip7"));
prueba("no abre próximamente ni inexistentes", () => {
  assert.equal(C.juegoParaAbrir(cat, { modo: "abrir", id: "asesino" }), null);
  assert.equal(C.juegoParaAbrir(cat, { modo: "abrir", id: "nada" }), null);
});
prueba("no cambia la selección guardada", () =>
  assert.deepEqual(C.resolverSeleccion(cat, { modo: "abrir", id: "uno" }, ["cah"]), { seleccion: ["cah"], guardar: undefined }));

console.log("Link para compartir");
prueba("arma ?juegos=", () =>
  assert.equal(C.linkSeleccion("https://x.io/hub/?todos#a", ["cah", "uno"]), "https://x.io/hub/?juegos=cah,uno"));
prueba("sin selección devuelve la base", () => assert.equal(C.linkSeleccion("https://x.io/hub/?juegos=cah", null), "https://x.io/hub/"));

console.log("juegos.json");
prueba("detecta errores", () => {
  const e = C.validarCatalogo([{ id: "A B", nombre: "", url: "ftp://x", tipo: "otro", estado: "ya" }]);
  assert.equal(e.length, 5);
});
prueba("el juegos.json del repo está bien", () => {
  const real = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "juegos.json"), "utf8"));
  assert.deepEqual(C.validarCatalogo(real), []);
});

console.log(`\n${ok} bien, ${fallas} mal`);
process.exit(fallas ? 1 : 0);
