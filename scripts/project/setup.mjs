#!/usr/bin/env node
// pnpm project:setup — asistente en consola (design D3). Sin dependencias.
// Pregunta cada dato con su valor actual (Enter = mantener), valida al momento,
// muestra un resumen y solo aplica tras confirmar.
import { copyFileSync, existsSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { applyProject, formatResult, readLocalDb } from "./apply.mjs";
import { dbKeys } from "./lib/rules.mjs";
import { CONFIG_FILE, loadConfig, validators } from "./lib/config.mjs";
import { parseColor } from "./lib/color.mjs";
import { assertCleanTree } from "./lib/git.mjs";
import { BRAND_TOKENS } from "./lib/config.mjs";
import * as dockerChecks from "./lib/checks.mjs";

const PUBLIC_DIR = "modules/frontend/public";
const LOGO_EXT = new Set([".png", ".svg", ".webp"]);
const FAVICON_EXT = new Set([".svg", ".png", ".ico"]);
const LOGO_VARIANTS = [
  ["light", "Logo para tema claro"],
  ["dark", "Logo para tema oscuro"],
  ["white", "Logo blanco (panel con gradiente)"],
];
const COLOR_LABELS = {
  primary: "color primario",
  ring: "anillo de foco",
  "brand-start": "gradiente: inicio",
  "brand-end": "gradiente: fin",
};

/** Lector de respuestas: las líneas que llegan antes de preguntar quedan en búfer. */
function createAsker(input, output) {
  input.setEncoding?.("utf8");
  const rl = readline.createInterface({ input, terminal: false, crlfDelay: Infinity });
  const lines = rl[Symbol.asyncIterator]();
  const next = async () => {
    const { value, done } = await lines.next();
    if (done) throw new Error("Entrada terminada antes de completar el asistente.");
    return value.trim();
  };
  /**
   * Pregunta con valor por defecto; `parse` devuelve {value} o {error}.
   * `hint`: explicación (qué es, ejemplo, qué pasa al cambiarlo) que se muestra antes.
   */
  async function ask(label, current, parse, hint) {
    if (hint) output.write(`\n  ${hint.split("\n").join("\n  ")}\n`);
    for (;;) {
      output.write(`? ${label} (${current ?? "—"}): `);
      const answer = await next();
      if (answer === "") return current;
      const result = parse(answer);
      if (!result.error) return result.value;
      output.write(`  ✖ ${result.error}\n`);
    }
  }
  async function confirm(label) {
    for (;;) {
      output.write(`? ${label} (s/N): `);
      const answer = (await next()).toLowerCase();
      if (answer === "" || answer === "n" || answer === "no") return false;
      if (answer === "s" || answer === "si" || answer === "sí" || answer === "y") return true;
      output.write("  ✖ responde s o n\n");
    }
  }
  return { ask, confirm, close: () => rl.close() };
}

const byValidator = (validator) => (answer) => {
  const error = validator(answer);
  return error ? { error } : { value: answer };
};

const asPort = (answer) => {
  const n = Number(answer);
  const error = /^\d+$/.test(answer) ? validators.port(n) : "debe ser un entero entre 1 y 65535";
  return error ? { error } : { value: n };
};

const asColor = (answer) => {
  const value = parseColor(answer);
  return value ? { value } : { error: validators.color(answer) };
};

function asImageFile(allowed) {
  return (answer) => {
    const file = path.resolve(answer.replace(/^["']|["']$/g, ""));
    if (!existsSync(file) || !statSync(file).isFile()) return { error: `no existe el archivo ${file}` };
    const ext = path.extname(file).toLowerCase();
    if (!allowed.has(ext)) return { error: `formato no admitido (${[...allowed].join(", ")})` };
    return { value: file };
  };
}

/** Plan de copia de logos/favicon: nada se escribe hasta confirmar. */
function planAssets(root, current, sources) {
  const copies = [];
  const next = structuredClone(current.brand);
  for (const [key, source] of Object.entries(sources)) {
    const ext = path.extname(source).toLowerCase();
    const publicPath = key === "favicon" ? `/brand/favicon${ext}` : `/brand/logo-${key}${ext}`;
    const dest = path.join(root, PUBLIC_DIR, publicPath);
    const same = existsSync(dest) && readFileSync(dest).equals(readFileSync(source));
    copies.push({ key, source, dest, publicPath, action: same ? "sin cambios" : existsSync(dest) ? "reemplaza" : "copia" });
    if (key === "favicon") next.favicon = publicPath;
    else next.logo[key] = publicPath;
  }
  // Archivos anteriores de /brand/ que ya nadie referencia (p. ej. al cambiar de .png a .svg).
  const referenced = new Set([...Object.values(next.logo), next.favicon]);
  const removals = [...Object.values(current.brand.logo), current.brand.favicon]
    .filter((p, i, all) => all.indexOf(p) === i)
    .filter((p) => p.startsWith("/brand/") && !referenced.has(p))
    .map((p) => path.join(root, PUBLIC_DIR, p))
    .filter((f) => existsSync(f));
  return { brand: next, copies, removals };
}

function executeAssets({ copies, removals }) {
  for (const { source, dest, action } of copies) {
    if (action === "sin cambios") continue;
    const tmp = `${dest}.tmp-${process.pid}`;
    copyFileSync(source, tmp);
    renameSync(tmp, dest); // atómico: nunca queda una copia parcial
  }
  for (const file of removals) rmSync(file);
}

function describeChanges(before, after, assets, dbPassword) {
  const rows = [];
  const cmp = (label, a, b) => {
    if (JSON.stringify(a) !== JSON.stringify(b)) rows.push(`  ${label.padEnd(26)} ${a} → ${b}`);
  };
  cmp("nombre", before.name, after.name);
  cmp("tagline", before.tagline, after.tagline);
  cmp("descripción", before.description, after.description);
  cmp("BD · nombre", before.database.name, after.database.name);
  cmp("BD · usuario", before.database.user, after.database.user);
  cmp("BD · puerto", before.database.port, after.database.port);
  cmp("BD · contenedor", before.database.container, after.database.container);
  cmp("JWT issuer", before.jwtIssuer, after.jwtIssuer);
  for (const mode of ["light", "dark"]) {
    for (const token of BRAND_TOKENS) {
      cmp(`color ${mode === "light" ? "claro" : "oscuro"} · ${token}`, before.brand.colors[mode][token], after.brand.colors[mode][token]);
    }
  }
  for (const c of assets.copies) {
    if (c.action !== "sin cambios") rows.push(`  ${`logo · ${c.key}`.padEnd(26)} ${c.action}: ${path.basename(c.source)} → ${c.publicPath}`);
  }
  for (const f of assets.removals) rows.push(`  ${"logo · retira".padEnd(26)} ${path.basename(f)} (ya no se usa)`);
  if (dbPassword) rows.push(`  ${"BD · clave".padEnd(26)} se guardará solo en modules/backend/secrets.properties`);
  return rows;
}

/** Filas del resumen para tu secrets.properties local (antes → después, por clave). */
function describeLocalChanges(localDb, next) {
  if (!localDb) return [`  ${"secrets.properties".padEnd(26)} se creará (con JWT_SECRET aleatorio)`];
  const before = { DB_NAME: localDb.name, DB_USERNAME: localDb.user, DB_PORT: localDb.port, DB_CONTAINER_NAME: localDb.container, JWT_ISSUER: localDb.jwtIssuer };
  const after = dbKeys(next);
  return Object.keys(before)
    .filter((key) => String(before[key] ?? "") !== String(after[key]))
    .map((key) => `  ${`secrets.properties · ${key}`.padEnd(26)} ${before[key] ?? "—"} → ${after[key]}`);
}

/**
 * Ejecuta el asistente. `input`/`output` inyectables (tests). Devuelve
 * { cancelled } | { noChanges } | { applied: resultadoDeApply }.
 */
export async function runSetup({
  root,
  input = process.stdin,
  output = process.stdout,
  allowDirty = false,
  // Comprobaciones del entorno (inyectables para que los tests no dependan de la máquina).
  checks = dockerChecks,
} = {}) {
  const { warning } = assertCleanTree(root, { allowDirty });
  const current = loadConfig(root);
  const q = createAsker(input, output);
  try {
    if (warning) output.write(`${warning}\n\n`);
    output.write("Configura el proyecto. Enter = mantener el valor actual.\n\n— Proyecto —\n");
    const next = structuredClone(current);
    next.name = await q.ask("Nombre del proyecto", current.name, byValidator(validators.name),
      "Se ve en el login, la barra lateral, la pestaña del navegador, OpenAPI y los docs. Ej: Acme CRM");
    // Si cambia el nombre, los textos propuestos ya lo llevan actualizado (Enter = aceptar).
    const renamed = (text) => (next.name === current.name ? text : text.split(current.name).join(next.name));
    next.tagline = await q.ask("Tagline", renamed(current.tagline), byValidator(validators.tagline),
      "Frase corta y grande del panel de marca del login. Ej: Gestiona tus clientes con claridad.");
    next.description = await q.ask("Descripción", renamed(current.description), byValidator(validators.description),
      "Una frase sobre el producto: bajo el tagline del login y como descripción de la API (OpenAPI).");

    // Si ya tienes secrets.properties, los valores por defecto son los TUYOS (Enter no cambia nada).
    const localDb = readLocalDb(root);
    const db = {
      name: localDb?.name ?? current.database.name,
      user: localDb?.user ?? current.database.user,
      port: localDb?.port ?? current.database.port,
      container: localDb?.container ?? current.database.container,
      jwtIssuer: localDb?.jwtIssuer ?? current.jwtIssuer,
    };
    output.write(
      "\n— Base de datos (PostgreSQL en Docker) —\n" +
      "  Son los datos con los que el backend se conecta a Postgres. NO son usuarios de la app.\n" +
      "  Docker crea la BD, el usuario y la contraseña SOLO la primera vez que levanta un contenedor nuevo.\n" +
      (localDb ? "  Valores actuales tomados de tu modules/backend/secrets.properties.\n" : ""),
    );
    next.database.name = await q.ask("Nombre de la base de datos", db.name, byValidator(validators.dbIdent),
      "Solo letras, números y _. Ej: app, acme");
    next.database.user = await q.ask("Usuario de PostgreSQL", db.user, byValidator(validators.dbIdent),
      "Con él se conecta el backend. Ej: app, postgres");
    const dbPassword = await q.ask("Contraseña de PostgreSQL", undefined, (a) => ({ value: a }),
      "Solo se guarda en tu secrets.properties (no se versiona). Se ve al escribir.\n" +
      "Enter = no cambiar (si es una copia nueva queda la del ejemplo: cambia-esta-clave).");
    const container = await q.ask("Nombre del contenedor Docker", db.container, byValidator(validators.container),
      "También nombra el volumen de datos (<nombre>_pgdata): cada proyecto el suyo. Solo minúsculas, números, - y _. Ej: acme-db");
    next.database.container = container;
    let port = await q.ask("Puerto en tu máquina", db.port, asPort,
      "Puerto por el que tu PC llega al Postgres del contenedor. Si ya tienes Postgres instalado, usa otro. Ej: 5436");
    // Un puerto ocupado solo se acepta si lo publica el contenedor de ESTE proyecto.
    while ((await checks.portInUse(port)) && !checks.containerPublishes(container, port)) {
      output.write(
        `  ✖ El puerto ${port} ya lo usa otro programa en esta máquina (¿Postgres instalado u otro contenedor?).\n` +
        "    Si lo usas, el backend se conectaría a ese otro Postgres. Elige un puerto libre.\n",
      );
      port = await q.ask("Puerto en tu máquina", undefined, asPort);
    }
    next.database.port = port;

    // Usuario, clave y BD viven en el VOLUMEN: solo se crean con el volumen vacío.
    const hasData = checks.volumeExists(container) || checks.containerExists(container);
    const identityChanged = next.database.name !== db.name || next.database.user !== db.user;
    let syncPasswordInContainer = false;
    if (hasData && identityChanged) {
      output.write(
        `  ⚠ El proyecto "${container}" ya tiene datos en Docker (volumen ${container}_pgdata): el nuevo nombre de BD/usuario\n` +
        "    NO se aplicará a esos datos. Para recrearlos (BORRA los datos): en modules/backend,\n" +
        "    docker compose --env-file secrets.properties down -v   — o elige otro nombre de contenedor.\n",
      );
    } else if (hasData && dbPassword !== undefined) {
      if (checks.containerRunning(container)) {
        syncPasswordInContainer = true;
        output.write(`  ✔ Al aplicar, la contraseña también se cambiará dentro del Postgres del contenedor "${container}".\n`);
      } else {
        output.write(
          `  ⚠ El contenedor "${container}" no está en marcha: no se puede cambiar la contraseña dentro de Postgres.\n` +
          "    Levántalo (docker compose --env-file secrets.properties up -d) y vuelve a ejecutar el asistente,\n" +
          "    o la conexión fallará porque Postgres seguirá con la contraseña anterior.\n",
        );
      }
    }
    next.jwtIssuer = await q.ask("Emisor de los tokens (JWT issuer)", db.jwtIssuer, byValidator(validators.jwtIssuer),
      "Identifica a tu backend dentro de los tokens de sesión. Si no sabes qué poner, Enter.");

    const sources = {};
    output.write("\n— Marca —\n");
    if (await q.confirm("¿Cambiar logos? (archivos png, svg o webp de tu PC)")) {
      output.write("  Indica la ruta de cada archivo (Enter = mantener el actual). Se copian a modules/frontend/public/brand/.\n");
      for (const [variant, label] of LOGO_VARIANTS) {
        const file = await q.ask(`${label}: ruta del archivo`, undefined, asImageFile(LOGO_EXT));
        if (file) sources[variant] = file;
      }
      const favicon = await q.ask("Favicon (icono de la pestaña: svg, png o ico): ruta del archivo", undefined, asImageFile(FAVICON_EXT));
      if (favicon) sources.favicon = favicon;
    }
    if (await q.confirm("¿Cambiar colores de marca? (hex #rrggbb o hsl(H S% L%))")) {
      output.write("  Enter = mantener cada color. Primario: botones y enlaces; gradiente: panel del login.\n");
      for (const mode of ["light", "dark"]) {
        for (const token of BRAND_TOKENS) {
          const label = `Tema ${mode === "light" ? "claro" : "oscuro"} · ${COLOR_LABELS[token]}`;
          next.brand.colors[mode][token] = await q.ask(label, current.brand.colors[mode][token], asColor);
        }
      }
    }

    const assets = planAssets(root, current, sources);
    next.brand = { ...next.brand, logo: assets.brand.logo, favicon: assets.brand.favicon };
    const projectRows = describeChanges(current, next, assets, dbPassword);
    const localRows = describeLocalChanges(localDb, next);
    if (projectRows.length === 0 && (localDb ? localRows.length === 0 : true)) {
      output.write("\nNo hay cambios.\n");
      if (!localDb) output.write("(Para crear tu secrets.properties local con estos valores: pnpm project:apply)\n");
      return { noChanges: true };
    }
    const rows = [...projectRows, ...localRows];
    if (syncPasswordInContainer) {
      rows.push(`  ${"BD · contraseña".padEnd(26)} se cambiará también en el contenedor ${container} (ALTER USER)`);
    }
    output.write(`\nResumen:\n${rows.join("\n")}\n\n`);
    if (!(await q.confirm("¿Aplicar estos cambios?"))) {
      output.write("Cancelado. No se modificó ningún archivo.\n");
      return { cancelled: true };
    }

    executeAssets(assets);
    writeFileSync(path.join(root, CONFIG_FILE), JSON.stringify(next, null, 2) + "\n", "utf8");
    // forceLocal: los valores de BD los confirmaste tú aquí (por defecto eran los de tu secrets.properties).
    const applied = applyProject(root, { allowDirty, dbPassword, forceLocal: true });
    formatResult({ ...applied, warning: undefined }, output); // el aviso ya se mostró al empezar
    if (syncPasswordInContainer) {
      const error = checks.syncPassword(container, next.database.user, next.database.name, dbPassword);
      output.write(
        error
          ? `\n✖ No se pudo cambiar la contraseña dentro del contenedor: ${error}\n` +
              `  Hazlo a mano: docker exec -it ${container} psql -U ${next.database.user} -d ${next.database.name} -c "ALTER USER ${next.database.user} WITH PASSWORD '…';"\n`
          : `\n✔ Contraseña actualizada también en el Postgres del contenedor "${container}".\n`,
      );
    }
    return { applied };
  } finally {
    q.close();
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  if (process.platform === "win32" && process.stdout.isTTY) {
    process.stdout.write("(Si ves caracteres raros en los acentos, ejecuta `chcp 65001` y vuelve a lanzar el asistente.)\n");
  }
  runSetup({ root, allowDirty: process.argv.includes("--allow-dirty") }).catch((e) => {
    process.stderr.write(`\n✖ ${e.message}\n`);
    process.exit(1);
  });
}
