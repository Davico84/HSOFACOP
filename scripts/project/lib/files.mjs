// Recorrido de archivos del repo (versionados + nuevos no ignorados), UTF-8.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { isGitRepo } from "./git.mjs";

const BINARY_EXT = /\.(png|jpe?g|gif|webp|ico|pdf|zip|jar|woff2?|ttf|eot|class|pyc)$/i;

// Sin git (copia descargada como ZIP): se ignoran las mismas carpetas y archivos
// locales que ignora el .gitignore de la plantilla.
const NO_GIT_IGNORED_DIRS = new Set([".git", "node_modules", "target", "dist", "coverage", ".husky/_", "__pycache__"]);
const NO_GIT_IGNORED_FILES = /(^|\/)(secrets\.properties|\.env(\.[^/]*)?)$/;

function walk(root, dir = "") {
  const files = [];
  for (const entry of readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = dir ? `${dir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (NO_GIT_IGNORED_DIRS.has(entry.name) || NO_GIT_IGNORED_DIRS.has(rel)) continue;
      files.push(...walk(root, rel));
    } else if (!NO_GIT_IGNORED_FILES.test(rel) || /\.example$/.test(rel)) {
      files.push(rel);
    }
  }
  return files;
}

/** Rutas (con `/`) de los archivos que git conoce o que no están ignorados (o del disco, sin git). */
export function listRepoFiles(root) {
  if (!isGitRepo(root)) return walk(root);
  const out = execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], { cwd: root, encoding: "utf8" });
  return out.split("\0").filter(Boolean);
}

export function isBinary(file, buffer) {
  if (BINARY_EXT.test(file)) return true;
  return buffer.subarray(0, 8000).includes(0);
}

/** Lee un archivo de texto en UTF-8 (o `null` si es binario o no existe). */
export function readText(root, file) {
  let buffer;
  try {
    buffer = readFileSync(path.join(root, file));
  } catch {
    return null;
  }
  return isBinary(file, buffer) ? null : buffer.toString("utf8");
}
