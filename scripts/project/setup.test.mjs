// Scenarios de template-bootstrap → "Asistente de configuración en consola".
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { Readable, Writable } from "node:stream";
import { runSetup } from "./setup.mjs";
import { REPO_ROOT, hashFiles, makeRepoCopy, read, trackedFiles } from "./support/repo-copy.mjs";

// Identidad aplicada en el repo real: los tests no dependen de cuál sea.
const ORIGINAL = JSON.parse(read(REPO_ROOT, ".template/applied.json"));
const SECRETS = "modules/backend/secrets.properties";
const BRAND_DIR = "modules/frontend/public/brand";

/**
 * Respuestas del asistente en orden. `overrides` sustituye por clave; las secciones
 * de logos/colores se activan pasando arrays.
 */
function answers({ name = "", tagline = "", description = "", dbName = "", dbUser = "", dbPassword = "", container = "", port = [""], issuer = "", logos, colors, confirm = "s" } = {}) {
  const lines = [name, tagline, description, dbName, dbUser, dbPassword, container, ...port, issuer];
  lines.push(logos ? "s" : "n", ...(logos ?? []));
  lines.push(colors ? "s" : "n", ...(colors ?? []));
  if (confirm !== null) lines.push(confirm);
  return lines.join("\n") + "\n";
}

// Por defecto, entorno "limpio": ningún puerto ocupado ni nada de Docker existente.
const NO_CHECKS = {
  portInUse: async () => false,
  containerPublishes: () => false,
  containerExists: () => false,
  containerRunning: () => false,
  volumeExists: () => false,
  syncPassword: () => {
    throw new Error("no debería sincronizar la contraseña en este test");
  },
};

async function run(root, input, checks = NO_CHECKS) {
  let out = "";
  const output = new Writable({ write(chunk, _enc, cb) { out += chunk.toString(); cb(); } });
  const result = await runSetup({ root, input: Readable.from([input]), output, checks });
  return { result, out };
}

async function withCopy(fn) {
  const { root, cleanup } = makeRepoCopy();
  const assets = mkdtempSync(path.join(tmpdir(), "logos-"));
  try {
    return await fn(root, assets);
  } finally {
    cleanup();
    rmSync(assets, { recursive: true, force: true });
  }
}

const config = (root) => JSON.parse(read(root, "project.config.json"));

test("Mantener valores con Enter", () =>
  withCopy(async (root) => {
    const before = hashFiles(root, trackedFiles(root));
    const { result, out } = await run(root, answers({ confirm: null }));
    assert.equal(result.noChanges, true);
    assert.match(out, /No hay cambios/);
    assert.equal(hashFiles(root, trackedFiles(root)), before);
  }));

test("Respuesta inválida", () =>
  withCopy(async (root) => {
    const { out } = await run(root, answers({ name: "Clínica Ñandú", port: ["abc", "0", "5441"], dbName: "" }));
    assert.match(out, /✖ debe ser un entero entre 1 y 65535/);
    assert.equal((out.match(/\? Puerto/g) ?? []).length, 3, "repregunta el mismo dato hasta que es válido");
    const c = config(root);
    assert.equal(c.database.port, 5441);
    assert.equal(c.name, "Clínica Ñandú"); // UTF-8 conservado
    // Texto propuesto al cambiar el nombre: el original con el nombre nuevo (Enter = aceptarlo).
    assert.equal(c.description, ORIGINAL.description.split(ORIGINAL.name).join("Clínica Ñandú"));
    assert.match(read(root, "CLAUDE.md"), /Clínica Ñandú/);
  }));

test("Colores en hex o hsl", () =>
  withCopy(async (root) => {
    const colors = ["#1D4ED8", "hsl(1 2% 3% / 50%)", "hsl(221, 76%, 48%)", "", "", "", "#ABC", "", ""];
    //              primary  ring (inválido → repregunta) ring válido     start end | dark: primary ring start end
    const { out } = await run(root, answers({ colors }));
    assert.match(out, /✖ usa #rgb, #rrggbb o hsl/);
    const c = config(root).brand.colors;
    assert.equal(c.light.primary, "#1d4ed8");
    assert.equal(c.light.ring, "hsl(221 76% 48%)");
    assert.equal(c.dark.ring, "#abc");
    assert.match(read(root, "modules/frontend/src/styles/globals.css"), /--primary: #1d4ed8;/);
  }));

test("Logo desde un archivo", () =>
  withCopy(async (root, assets) => {
    // Extensión distinta de la actual para forzar el "cambio de extensión".
    const currentExt = path.extname(ORIGINAL.brand.logo.light);
    const ext = currentExt === ".webp" ? ".png" : ".webp";
    const image = path.join(assets, `acme${ext}`);
    const gif = path.join(assets, "acme.gif");
    writeFileSync(image, "imagen");
    writeFileSync(gif, "GIF89a");
    const logos = [
      path.join(assets, "no-existe.png"), image, // claro: ruta inexistente → repregunta → imagen
      image, //                                    oscuro: misma fuente que el claro
      gif, "", //                                  blanco: formato no admitido → repregunta → mantener
      "", //                                       favicon: mantener
    ];
    const { out } = await run(root, answers({ logos }));
    assert.match(out, /✖ no existe el archivo/);
    assert.match(out, /✖ formato no admitido/);
    const { logo } = config(root).brand;
    assert.equal(logo.light, `/brand/logo-light${ext}`);
    assert.equal(logo.dark, `/brand/logo-dark${ext}`);
    assert.equal(logo.white, ORIGINAL.brand.logo.white, "variante mantenida");
    assert.ok(existsSync(path.join(root, BRAND_DIR, `logo-light${ext}`)));
    assert.ok(existsSync(path.join(root, BRAND_DIR, `logo-dark${ext}`)));
    const oldLight = path.join(root, "modules/frontend/public", ORIGINAL.brand.logo.light);
    assert.ok(!existsSync(oldLight), "retira la variante anterior (cambio de extensión)");
    assert.ok(existsSync(path.join(root, "modules/frontend/public", ORIGINAL.brand.logo.white)), "no toca la variante mantenida");
  }));

test("Puerto ocupado por otro programa", () =>
  withCopy(async (root) => {
    const checks = { ...NO_CHECKS, portInUse: async (p) => p === 5432 };
    // 5432 ocupado por otro programa → no se acepta (sin "usar igualmente") → se repregunta → 5436 libre.
    const { out } = await run(root, answers({ port: ["5432", "5436"] }), checks);
    assert.match(out, /✖ El puerto 5432 ya lo usa otro programa/);
    assert.doesNotMatch(out, /igualmente/);
    assert.equal(config(root).database.port, 5436);
  }));

test("Puerto publicado por el contenedor del proyecto", () =>
  withCopy(async (root) => {
    const container = ORIGINAL.database.container;
    const checks = {
      ...NO_CHECKS,
      portInUse: async (p) => p === 5436,
      containerPublishes: (name, p) => name === container && p === 5436,
    };
    const { out } = await run(root, answers({ port: ["5436"] }), checks);
    assert.doesNotMatch(out, /ya lo usa otro programa/, "es el contenedor de este proyecto: se acepta sin avisar");
    assert.equal(config(root).database.port, 5436);
  }));

test("Aviso de datos existentes", () =>
  withCopy(async (root) => {
    const checks = { ...NO_CHECKS, volumeExists: (name) => name === ORIGINAL.database.container };
    const { out } = await run(root, answers({ dbUser: "postgres" }), checks);
    assert.match(out, /ya tiene datos en Docker \(volumen .+_pgdata\): el nuevo nombre de BD\/usuario/);
    assert.match(out, /down -v/);
    assert.equal(config(root).database.user, "postgres"); // avisa, no bloquea
  }));

test("Cambio de contraseña sincronizado en el contenedor", () =>
  withCopy(async (root) => {
    const container = ORIGINAL.database.container;
    const calls = [];
    const checks = {
      ...NO_CHECKS,
      volumeExists: (name) => name === container,
      containerRunning: (name) => name === container,
      syncPassword: (...args) => {
        calls.push(args);
        return null;
      },
    };
    const { out } = await run(root, answers({ dbPassword: "nueva-ñ" }), checks);
    assert.match(out, /se cambiará también en el contenedor/);
    assert.deepEqual(calls, [[container, ORIGINAL.database.user, ORIGINAL.database.name, "nueva-ñ"]]);
    assert.match(out, /✔ Contraseña actualizada también en el Postgres/);
    assert.match(read(root, SECRETS), /^DB_PASSWORD=nueva-ñ$/m);
  }));

test("Cambio de contraseña con el contenedor parado", () =>
  withCopy(async (root) => {
    const container = ORIGINAL.database.container;
    const checks = { ...NO_CHECKS, volumeExists: (name) => name === container };
    const { out } = await run(root, answers({ dbPassword: "nueva" }), checks);
    assert.match(out, /no está en marcha: no se puede cambiar la contraseña dentro de Postgres/);
  }));

test("Valores locales como predeterminados", () =>
  withCopy(async (root) => {
    // Tu secrets.properties ya existe con otros valores (p. ej. otro puerto y BD).
    const local = "DB_NAME=HSODB\nDB_USERNAME=odontorisas\nDB_PORT=5435\nDB_CONTAINER_NAME=hso-db\nJWT_ISSUER=hso\nDB_PASSWORD=mia\nJWT_SECRET=mio\n";
    writeFileSync(path.join(root, SECRETS), local);
    // Todo Enter salvo el puerto: el resumen solo debe mostrar ese cambio en secrets.properties.
    const { out } = await run(root, answers({ port: ["5436"] }));
    assert.match(out, /\? Nombre de la base de datos \(HSODB\)/, "por defecto: el valor de tu secrets.properties");
    assert.match(out, /\? Puerto en tu máquina \(5435\)/);
    assert.match(out, /secrets\.properties · DB_PORT\s+5435 → 5436/);
    assert.doesNotMatch(out, /secrets\.properties · DB_NAME/);
    const secrets = read(root, SECRETS);
    assert.match(secrets, /^DB_NAME=HSODB$/m, "Enter no cambia tus valores locales");
    assert.match(secrets, /^DB_PORT=5436$/m);
    assert.match(secrets, /^DB_PASSWORD=mia$/m);
    assert.match(secrets, /^JWT_SECRET=mio$/m);
  }));

test("Clave de base de datos solo en local", () =>
  withCopy(async (root) => {
    await run(root, answers({ dbPassword: "s3cr3t-ñ" }));
    assert.ok(!read(root, "project.config.json").includes("s3cr3t"));
    assert.ok(!read(root, "modules/backend/secrets.properties.example").includes("s3cr3t"));
    assert.match(read(root, SECRETS), /^DB_PASSWORD=s3cr3t-ñ$/m);
  }));

test("Cancelar en el resumen", () =>
  withCopy(async (root, assets) => {
    const svg = path.join(assets, "acme.svg");
    writeFileSync(svg, "<svg xmlns='http://www.w3.org/2000/svg'/>");
    const tracked = trackedFiles(root);
    const before = hashFiles(root, tracked);
    const brandBefore = readdirSync(path.join(root, BRAND_DIR)).sort();
    const { result, out } = await run(root, answers({ name: "Otro", dbPassword: "x", logos: [svg, "", "", ""], confirm: "n" }));
    assert.equal(result.cancelled, true);
    assert.match(out, /Cancelado/);
    assert.equal(hashFiles(root, tracked), before);
    assert.deepEqual(readdirSync(path.join(root, BRAND_DIR)).sort(), brandBefore, "sin copias ni temporales");
    assert.ok(!existsSync(path.join(root, SECRETS)));
  }));
