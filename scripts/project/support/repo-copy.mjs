// Utilidades de test: copia del repo real a un directorio temporal con su propio git.
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" });

/** Archivos que viajan en la copia: los versionados + nuevos no ignorados (sin node_modules/target). */
function repoFiles() {
  return git(REPO_ROOT, "ls-files", "-co", "--exclude-standard", "-z")
    .split("\0")
    .filter(Boolean)
    .filter((f) => !/(^|\/)(node_modules|target|dist)\//.test(f));
}

let cachedFiles;

/** Crea una copia del repo con un commit inicial (árbol limpio). Devuelve { root, cleanup }. */
export function makeRepoCopy() {
  cachedFiles ??= repoFiles();
  const root = mkdtempSync(path.join(tmpdir(), "project-setup-"));
  for (const file of cachedFiles) {
    const src = path.join(REPO_ROOT, file);
    const dest = path.join(root, file);
    mkdirSync(path.dirname(dest), { recursive: true });
    try {
      cpSync(src, dest);
    } catch {
      // Archivos borrados en el árbol de trabajo pero aún en el índice: se omiten.
    }
  }
  git(root, "init", "-q");
  git(root, "config", "user.email", "test@example.com");
  git(root, "config", "user.name", "test");
  git(root, "config", "core.autocrlf", "false");
  git(root, "add", "-A");
  git(root, "commit", "-q", "-m", "copia");
  return { root, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

export const read = (root, file) => readFileSync(path.join(root, file), "utf8");
export const write = (root, file, content) => {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  writeFileSync(path.join(root, file), content, "utf8");
};

/** Cambia campos de project.config.json en la copia. */
export function editConfig(root, mutate) {
  const config = JSON.parse(read(root, "project.config.json"));
  mutate(config);
  write(root, "project.config.json", JSON.stringify(config, null, 2) + "\n");
  return config;
}

/** Hash de un conjunto de archivos (para comprobar "no cambió nada"). */
export function hashFiles(root, files) {
  const h = createHash("sha256");
  for (const f of files) h.update(f).update("\0").update(readFileSync(path.join(root, f)));
  return h.digest("hex");
}

export const trackedFiles = (root) => git(root, "ls-files", "-z").split("\0").filter(Boolean);
export const gitStatus = (root) => git(root, "status", "--porcelain");

/** Identidad de ejemplo usada en los tests y en el ensayo de CI. */
export function acme(config) {
  config.name = "Acme CRM";
  config.tagline = "Gestiona tus clientes con claridad.";
  config.description = "Plataforma de gestión de clientes de Acme.";
  config.database = { name: "acme", user: "acme_user", port: 5440, container: "acme-db" };
  config.jwtIssuer = "acme-crm";
  config.brand.colors.light.primary = "#1D4ED8";
  config.brand.colors.dark.primary = "hsl(221, 76%, 60%)";
}
