#!/usr/bin/env node
// pnpm project:apply [--dry-run] [--allow-dirty] [--no-local]
// Aplica project.config.json al repo (design D4/D5). Sin dependencias.
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  APPLIED_FILE,
  loadApplied,
  loadConfig,
  normalizeColors,
  sameIdentity,
  stripSchema,
  validateConfig,
} from "./lib/config.mjs";
import { listRepoFiles, readText } from "./lib/files.mjs";
import { assertCleanTree } from "./lib/git.mjs";
import { readProperty, updateProperties } from "./lib/properties.mjs";
import {
  FILE_RULES,
  PATHS,
  SCAN_EXCLUDE,
  TEXT_RULE,
  applyGeneratedHeader,
  brandTokensIn,
  dbKeys,
} from "./lib/rules.mjs";

const writeUtf8 = (file, content) => {
  mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  writeFileSync(tmp, content, "utf8");
  renameSync(tmp, file); // escritura atómica: nunca un archivo a medias
};

/** Plan de cambios en archivos versionados: Map<ruta, contenidoNuevo>. */
function planRepoChanges(root, from, to) {
  const plan = new Map();
  const current = (file) => plan.get(file) ?? readText(root, file);
  const set = (file, next) => {
    if (next !== readText(root, file)) plan.set(file, next);
    else plan.delete(file);
  };

  for (const rule of FILE_RULES) {
    const text = current(rule.file);
    if (text === null) throw new Error(`No existe ${rule.file}`);
    set(rule.file, rule.apply(text, from, to));
  }

  const files = listRepoFiles(root);
  for (const file of files.filter((f) => f.startsWith(PATHS.generatedDir) && f.endsWith(".ts"))) {
    set(file, applyGeneratedHeader(current(file), from, to));
  }
  if (from.name !== to.name) {
    for (const file of files.filter((f) => TEXT_RULE.some((re) => re.test(f)))) {
      const text = current(file);
      if (text !== null && text.includes(from.name)) set(file, text.split(from.name).join(to.name));
    }
  }
  return { plan, files };
}

/** Escáner de restos del nombre anterior sobre el contenido planificado (antes de escribir). */
function scanLeftovers(root, files, plan, from, to) {
  if (from.name === to.name) return [];
  const hits = [];
  for (const file of files) {
    if (SCAN_EXCLUDE.some((re) => re.test(file))) continue;
    const text = plan.get(file) ?? readText(root, file);
    if (text === null || !text.includes(from.name)) continue;
    text.split("\n").forEach((line, i) => {
      if (line.includes(from.name)) hits.push(`${file}:${i + 1}: ${line.trim().slice(0, 120)}`);
    });
  }
  return hits;
}

/** Valores de BD/JWT de tu secrets.properties local (o `null` si no existe). Los usa el asistente. */
export function readLocalDb(root) {
  const file = path.join(root, PATHS.secrets);
  if (!existsSync(file)) return null;
  const text = readFileSync(file, "utf8");
  const port = Number(readProperty(text, "DB_PORT"));
  return {
    name: readProperty(text, "DB_NAME"),
    user: readProperty(text, "DB_USERNAME"),
    port: Number.isInteger(port) && port > 0 ? port : undefined,
    container: readProperty(text, "DB_CONTAINER_NAME"),
    jwtIssuer: readProperty(text, "JWT_ISSUER"),
  };
}

/**
 * Archivos locales (ignorados por git): secrets.properties y .env.
 * Si secrets.properties existe, una clave gestionada solo se actualiza si aún tiene el
 * valor por defecto anterior (el derivado de `from`); si la personalizaste, se conserva
 * y se informa. `forceLocal` (asistente: valores confirmados por el usuario) las escribe todas.
 */
function planLocalFiles(root, from, to, { dbPassword, forceLocal = false } = {}) {
  const local = [];
  const kept = [];
  const secretsPath = path.join(root, PATHS.secrets);
  const target = dbKeys(to);
  if (existsSync(secretsPath)) {
    const text = readFileSync(secretsPath, "utf8");
    const previous = dbKeys(from);
    const updates = {};
    for (const [key, value] of Object.entries(target)) {
      const current = readProperty(text, key);
      if (forceLocal || current === undefined || current === previous[key]) updates[key] = value;
      else if (current !== value) kept.push({ key, value: current });
    }
    if (dbPassword !== undefined) updates.DB_PASSWORD = dbPassword;
    const next = updateProperties(text, updates);
    if (next !== text) local.push({ file: PATHS.secrets, content: next, created: false, before: text });
  } else {
    const example = readFileSync(path.join(root, PATHS.secretsExample), "utf8");
    const content = updateProperties(example, {
      ...target,
      DB_PASSWORD: dbPassword,
      JWT_SECRET: randomBytes(48).toString("base64"),
    });
    local.push({ file: PATHS.secrets, content, created: true });
  }
  if (!existsSync(path.join(root, PATHS.env)) && existsSync(path.join(root, PATHS.envExample))) {
    local.push({ file: PATHS.env, content: readFileSync(path.join(root, PATHS.envExample), "utf8"), created: true });
  }
  return { local, kept };
}

/**
 * Aplica la configuración. Opciones: dryRun, allowDirty, noLocal (no toca
 * secrets.properties/.env), dbPassword (solo desde el asistente).
 * Devuelve { noChanges, changed, local, dryRun }.
 */
export function applyProject(root, opts = {}) {
  const { dryRun = false, allowDirty = false, noLocal = false, dbPassword, forceLocal = false } = opts;

  // 1) Validar la config antes que nada (error por campo, sin escrituras).
  const raw = loadConfig(root);
  const css = readText(root, PATHS.globalsCss) ?? "";
  const errors = validateConfig(raw, { brandTokens: brandTokensIn(css) });
  if (errors.length) {
    const err = new Error(`project.config.json no es válido:\n${errors.map((e) => `  - ${e}`).join("\n")}`);
    err.fields = errors;
    throw err;
  }
  const to = stripSchema(normalizeColors(raw));
  const from = loadApplied(root);
  if (from.name !== to.name) {
    const stale = ["tagline", "description"]
      .filter((field) => to[field].includes(from.name))
      .map((field) => `${field}: todavía contiene el nombre anterior "${from.name}"`);
    if (stale.length) {
      const err = new Error(`project.config.json no es válido:\n${stale.map((e) => `  - ${e}`).join("\n")}`);
      err.fields = stale;
      throw err;
    }
  }

  // 2) Árbol limpio (allowlist: la config y los logos). Sin git: aviso, no error.
  const { warning } = assertCleanTree(root, { allowDirty });

  // 3) Planificar.
  const same = sameIdentity(from, to);
  const { plan, files } = same ? { plan: new Map(), files: [] } : planRepoChanges(root, from, to);
  const { local, kept } = noLocal ? { local: [], kept: [] } : planLocalFiles(root, from, to, { dbPassword, forceLocal });

  // 4) Escáner sobre lo planificado: si queda el nombre anterior, no se escribe nada.
  const leftovers = same ? [] : scanLeftovers(root, files, plan, from, to);
  if (leftovers.length) {
    const err = new Error(
      `Quedaría el nombre anterior "${from.name}" en:\n${leftovers.slice(0, 20).map((h) => `  - ${h}`).join("\n")}\n` +
        "No se modificó ningún archivo. Añade una regla o revisa esos archivos.",
    );
    err.leftovers = leftovers;
    throw err;
  }

  const result = {
    noChanges: same && local.length === 0,
    changed: [...plan.keys()],
    local: local.map((l) => l.file),
    keptLocal: kept,
    dryRun,
    warning,
  };
  if (dryRun) return result;

  // 5) Escribir.
  for (const [file, content] of plan) writeUtf8(path.join(root, file), content);
  if (!same) writeUtf8(path.join(root, APPLIED_FILE), JSON.stringify(to, null, 2) + "\n");
  for (const { file, content } of local) writeUtf8(path.join(root, file), content);
  return result;
}

export function formatResult(result, out = process.stdout) {
  if (result.warning) out.write(`${result.warning}\n\n`);
  for (const { key, value } of result.keptLocal ?? []) {
    out.write(`  Se mantiene tu valor local ${key}=${value} (personalizado en secrets.properties; cámbialo con pnpm project:setup).\n`);
  }
  if (result.noChanges) return out.write("Sin cambios: la configuración ya está aplicada.\n");
  const verb = result.dryRun ? "Cambiaría" : "Actualizado";
  for (const f of result.changed) out.write(`  ${verb}: ${f}\n`);
  for (const f of result.local) out.write(`  ${verb} (local, no versionado): ${f}\n`);
  if (result.dryRun) return out.write("\n--dry-run: no se escribió nada.\n");
  out.write(
    "\nListo. Próximos pasos:\n" +
      "  1. Revisa `git diff` y commitea.\n" +
      "  2. Reescribe docs/vision.md y docs/domain.md con el contenido de tu producto.\n" +
      "  3. Si cambiaste la BD, recrea el contenedor: docker compose --env-file secrets.properties up -d (en modules/backend).\n",
  );
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = new Set(process.argv.slice(2));
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  try {
    formatResult(
      applyProject(root, { dryRun: args.has("--dry-run"), allowDirty: args.has("--allow-dirty"), noLocal: args.has("--no-local") }),
    );
  } catch (e) {
    process.stderr.write(`\n✖ ${e.message}\n`);
    process.exit(1);
  }
}
