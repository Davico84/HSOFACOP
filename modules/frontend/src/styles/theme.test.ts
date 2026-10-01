/// <reference types="node" />
// Test de Node (fs/path): corre en Vitest, no en el navegador.
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { compile } from "@tailwindcss/node";

// Contrato de tema (project-foundation → "Tema definido por tokens CSS").
// Vitest corre con `css: false`, así que aquí se compila el globals.css REAL con el
// compilador de Tailwind v4, igual que en el build.
const stylesDir = path.dirname(fileURLToPath(import.meta.url));
const globalsPath = path.join(stylesDir, "globals.css");
const globalsCss = readFileSync(globalsPath, "utf8");

/**
 * Devuelve la regla completa cuyo selector empieza por `selector`, admitiendo
 * pseudo-selectores detrás (`.dark\:hidden:where(.dark, .dark *)`) pero no otro
 * nombre de clase (`.bg-primary` no casa con `.bg-primary\/10`). Llaves balanceadas.
 */
function ruleFor(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const start = css.search(new RegExp(`${escaped}(?=[\\s:{])[^{]*\\{`));
  if (start === -1) throw new Error(`No se generó la regla ${selector}`);
  let depth = 0;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) return css.slice(start, i + 1);
  }
  throw new Error(`Regla ${selector} sin cerrar`);
}

/**
 * Variables declaradas en el bloque de PRIMER NIVEL `header { … }` de globals.css.
 * Se quitan los comentarios y se ancla al inicio de línea: si no, un `:root`/`.dark`
 * dentro de un comentario haría leer otro bloque y el test pasaría sin comprobar nada.
 */
function tokensOf(header: ":root" | ".dark"): Set<string> {
  const css = globalsCss.replace(/\/\*[\s\S]*?\*\//g, "");
  const escaped = header.replace(".", "\\.");
  const match = new RegExp(`^${escaped}\\s*\\{([^}]*)\\}`, "m").exec(css);
  if (!match) throw new Error(`globals.css no tiene un bloque ${header} de primer nivel`);
  return new Set([...match[1].matchAll(/--([\w-]+)\s*:/g)].map((m) => m[1]));
}

let build: (candidates: string[]) => string;

beforeAll(async () => {
  const compiler = await compile(globalsCss, { base: stylesDir, onDependency: () => {} });
  build = (candidates) => compiler.build(candidates);
});

describe("project-foundation — Tema definido por tokens CSS", () => {
  it("Utilidades generadas desde los tokens: cada utilidad se resuelve desde su variable", () => {
    const css = build(["bg-primary", "text-muted-foreground", "bg-primary/10", "from-brand-start"]);

    expect(ruleFor(css, ".bg-primary")).toContain("var(--primary)");
    expect(ruleFor(css, ".text-muted-foreground")).toContain("var(--muted-foreground)");
    expect(ruleFor(css, ".bg-primary\\/10")).toContain("var(--primary)");
    expect(ruleFor(css, ".from-brand-start")).toContain("var(--brand-start)");
  });

  it("Valores claros y oscuros de la paleta: todo token de color existe en :root y en .dark", () => {
    const light = tokensOf(":root");
    const dark = tokensOf(".dark");
    light.delete("radius"); // el radio no depende del tema

    expect(light.size).toBeGreaterThan(20);
    expect([...light].filter((t) => !dark.has(t))).toEqual([]);
    expect([...dark].filter((t) => !light.has(t))).toEqual([]);
  });

  it("Modo oscuro por clase: dark: depende de un ancestro .dark, no de prefers-color-scheme", () => {
    const css = build(["dark:hidden"]);
    const selector = ruleFor(css, ".dark\\:hidden").split("{")[0];

    // `.dark` debe aparecer en el selector además del propio nombre de la clase.
    expect(selector.replace(".dark\\:hidden", "")).toContain(".dark");
    // Con la variante por defecto, Tailwind envolvería la regla en @media (prefers-color-scheme).
    expect(css).not.toContain("prefers-color-scheme");
  });
});
