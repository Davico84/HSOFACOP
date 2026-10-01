// Árbol limpio con allowlist (design D5): solo se permite tener modificados
// project.config.json y los logos de modules/frontend/public/brand/.
import { execFileSync } from "node:child_process";

export const DIRTY_ALLOWLIST = [/^project\.config\.json$/, /^modules\/frontend\/public\/brand\//];

export const NO_GIT_WARNING =
  "Aviso: esta carpeta no es un repositorio git (¿copia descargada como ZIP?). Se aplicará igual, " +
  "pero no habrá forma automática de deshacer. Recomendado: `git init && git add -A && git commit -m inicial` antes.";

/** ¿`root` es la raíz (o está dentro) de un repositorio git? */
export function isGitRepo(root) {
  try {
    execFileSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: root, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/** Archivos con cambios sin commitear (incluye nuevos no ignorados). */
export function dirtyFiles(root) {
  const out = execFileSync("git", ["status", "--porcelain", "-uall", "-z"], { cwd: root, encoding: "utf8" });
  // Formato -z: "XY ruta\0" (renombres: "XY destino\0origen\0").
  const entries = out.split("\0").filter(Boolean);
  const files = [];
  for (let i = 0; i < entries.length; i++) {
    const status = entries[i].slice(0, 2);
    files.push(entries[i].slice(3));
    if (status.startsWith("R") || status.startsWith("C")) i++;
  }
  return files;
}

/**
 * Lanza un error si hay cambios fuera de la allowlist (salvo `allowDirty`).
 * Sin git no hay árbol que comprobar: devuelve un aviso en vez de fallar.
 */
export function assertCleanTree(root, { allowDirty = false } = {}) {
  if (!isGitRepo(root)) return { warning: NO_GIT_WARNING };
  if (allowDirty) return {};
  const blocked = dirtyFiles(root).filter((f) => !DIRTY_ALLOWLIST.some((re) => re.test(f)));
  if (blocked.length > 0) {
    const list = blocked.slice(0, 10).map((f) => `  - ${f}`).join("\n");
    throw new Error(
      `Hay cambios sin commitear fuera de project.config.json y public/brand/:\n${list}\n` +
        "Commitea o descarta esos cambios antes de aplicar (o usa --allow-dirty).",
    );
  }
  return {};
}
