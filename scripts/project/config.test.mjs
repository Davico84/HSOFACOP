// Scenarios de template-bootstrap: gramática de colores y "Configuración inválida".
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseColor } from "./lib/color.mjs";
import { applyProject } from "./apply.mjs";
import { validateConfig } from "./lib/config.mjs";
import { REPO_ROOT, editConfig, hashFiles, makeRepoCopy, trackedFiles, write } from "./support/repo-copy.mjs";

// Config original para restaurar entre casos.
const original = JSON.parse(readFileSync(`${REPO_ROOT}/project.config.json`, "utf8"));

test("gramática de colores: hex sin pérdida y hsl normalizado", () => {
  assert.equal(parseColor("#1D4ED8"), "#1d4ed8");
  assert.equal(parseColor("#ABC"), "#abc");
  assert.equal(parseColor("hsl(221 76% 48%)"), "hsl(221 76% 48%)");
  assert.equal(parseColor("hsl(221, 76%, 48%)"), "hsl(221 76% 48%)");
  assert.equal(parseColor(" hsl( 10.5  20%  30.5% ) "), "hsl(10.5 20% 30.5%)");
  for (const bad of ["rojo", "#abcd", "#1d4ed8ff", "hsl(1 2% 3% / 50%)", "hsla(1, 2%, 3%, .5)", "hsl(361 10% 10%)", "hsl(10 101% 10%)", "rgb(0,0,0)", ""]) {
    assert.equal(parseColor(bad), null, `debería rechazar ${JSON.stringify(bad)}`);
  }
});

const INVALID_CASES = [
  ["name", (c) => (c.name = "")],
  ["name", (c) => (c.name = "x".repeat(61))],
  ["database.name", (c) => (c.database.name = "1abc")],
  ["database.user", (c) => (c.database.user = "mi-usuario")],
  ["database.port", (c) => (c.database.port = 70000)],
  ["database.container", (c) => (c.database.container = "rafaDocker")], // Compose exige minúsculas
  ["brand.colors.light.primary", (c) => (c.brand.colors.light.primary = "rgba(0,0,0,.5)")],
  ["brand.colors.dark.secondary", (c) => (c.brand.colors.dark.secondary = "#fff")],
  ["tagline", (c) => delete c.tagline],
  ["jwtIssuer", (c) => (c.jwtIssuer = "con espacios")],
  ["contact.whatsapp", (c) => (c.contact = { whatsapp: "+51 959 396 384" })],
  ["contact.whatsapp", (c) => (c.contact = { whatsapp: "1234" })],
  ["contact.email", (c) => (c.contact = { email: "no-es-correo" })],
  ["contact", (c) => (c.contact = {})],
  ["contact.telefono", (c) => (c.contact = { telefono: "959396384" })],
  // Cambia el nombre pero la descripción sigue nombrando al anterior.
  ["description", (c) => { c.name = "Nuevo"; c.description = `Producto de ${original.name}.`; }],
];

test("Configuración inválida", () => {
  const { root, cleanup } = makeRepoCopy();
  try {
    const files = trackedFiles(root).filter((f) => f !== "project.config.json");
    const before = hashFiles(root, files);
    // Un cambio fuera de la allowlist: la validación debe fallar ANTES que la comprobación del árbol.
    write(root, "readme.md", "cambio sin commitear\n");
    const dirtyHash = hashFiles(root, files);
    for (const [field, mutate] of INVALID_CASES) {
      editConfig(root, mutate);
      assert.throws(
        () => applyProject(root, {}),
        (err) => Array.isArray(err.fields) && err.fields.some((f) => f.startsWith(`${field}:`)),
        `se esperaba error en ${field}`,
      );
      assert.equal(hashFiles(root, files), dirtyHash, `no debe escribir nada (${field})`);
      editConfig(root, (c) => Object.assign(c, JSON.parse(JSON.stringify(original))));
    }
    assert.notEqual(before, dirtyHash); // sanity: el readme sí estaba modificado por el test
  } finally {
    cleanup();
  }
});

test("Contacto de soporte opcional: ausente o completo es válido", () => {
  const { contact: _omit, ...withoutContact } = structuredClone(original);
  assert.deepEqual(validateConfig(withoutContact), []);
  assert.deepEqual(validateConfig({ ...withoutContact, contact: { whatsapp: "51959396384", email: "soporte@clinica.pe" } }), []);
  assert.deepEqual(validateConfig({ ...withoutContact, contact: { email: "soporte@clinica.pe" } }), []);
});
