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

/** Valores `--token: hsl(...)` del bloque de primer nivel `header` (sin comentarios). */
function valuesOf(header: ":root" | ".dark"): Map<string, [number, number, number]> {
  const css = globalsCss.replace(/\/\*[\s\S]*?\*\//g, "");
  const match = new RegExp(`^${header.replace(".", "\\.")}\\s*\\{([^}]*)\\}`, "m").exec(css);
  if (!match) throw new Error(`globals.css no tiene un bloque ${header} de primer nivel`);
  const out = new Map<string, [number, number, number]>();
  for (const [, name, h, s, l] of match[1].matchAll(/--([\w-]+):\s*hsl\(([\d.]+) ([\d.]+)% ([\d.]+)%\)/g)) {
    out.set(name, [Number(h), Number(s), Number(l)]);
  }
  return out;
}

function toRgb([h, s, l]: [number, number, number]): [number, number, number] {
  const sat = s / 100;
  const lig = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map((v) => Math.round(v * 255)) as [number, number, number];
}

const hex = (hsl: [number, number, number]) =>
  `#${toRgb(hsl)
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const lum = (hsl: [number, number, number]) => {
    const [r, g, bl] = toRgb(hsl).map((v) => {
      const c = v / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const SEMANTIC = /^(destructive|success|warning)/;
const READING_PAIRS: [string, string][] = [
  ["foreground", "background"],
  ["muted-foreground", "background"],
  ["muted-foreground", "muted"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["accent-foreground", "accent"],
];

/**
 * La paleta FACOP es de este proyecto, no de la plantilla: en un proyecto derivado con otra marca
 * (p. ej. el ensayo "Acme CRM" de CI) `project:apply` cambia el primario y estos checks no aplican.
 */
const projectConfig = JSON.parse(readFileSync(path.join(stylesDir, "../../../../project.config.json"), "utf8")) as {
  brand: { colors: { light: { primary: string } } };
};
const FACOP_ROXO = "hsl(297.4 50.8% 35.1%)";
const isFacopBrand = projectConfig.brand.colors.light.primary === FACOP_ROXO;

describe.skipIf(!isFacopBrand)("project-foundation — Paleta de la marca FACOP", () => {
  it("Color principal en modo claro: Roxo #832C87 y texto en Grafite #3C3C3B", () => {
    const light = valuesOf(":root");
    expect(hex(light.get("primary")!)).toBe("#832C87");
    expect(hex(light.get("foreground")!)).toBe("#3C3C3B");
  });

  it("Sin turquesa: fuera de los semánticos, solo tonos de Roxo o grises neutros", () => {
    for (const header of [":root", ".dark"] as const) {
      const offPalette = [...valuesOf(header)]
        .filter(([name]) => !SEMANTIC.test(name))
        .filter(([, [h, s]]) => s > 2 && Math.abs(h - 297) > 1)
        .map(([name]) => `${header} --${name}`);
      expect(offPalette).toEqual([]);
    }
  });

  it("Contraste de lectura: cada par texto/fondo cumple WCAG AA (4,5:1) en claro y en oscuro", () => {
    for (const header of [":root", ".dark"] as const) {
      const values = valuesOf(header);
      const failing = READING_PAIRS.filter(([text, bg]) => contrast(values.get(text)!, values.get(bg)!) < 4.5).map(
        ([text, bg]) => `${header} ${text}/${bg}`,
      );
      expect(failing).toEqual([]);
    }
  });

  it("Gris oficial no usado para texto: el texto secundario no es el Cinza #808080", () => {
    expect(hex(valuesOf(":root").get("muted-foreground")!)).not.toBe("#808080");
  });

  it("Hoja impresa en negro: el token de tinta es #000000 y genera text-ink/border-ink", () => {
    expect(hex(valuesOf(":root").get("ink")!)).toBe("#000000");
    const css = build(["text-ink", "border-ink"]);
    expect(ruleFor(css, ".text-ink")).toContain("var(--ink)");
    expect(ruleFor(css, ".border-ink")).toContain("var(--ink)");
  });
});
