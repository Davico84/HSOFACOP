/// <reference types="node" />
// Test de Node (fs/path): corre en Vitest, no en el navegador.
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// El CLI de shadcn (`add`) genera `import { cn } from "cn"` e instala el paquete npm
// `cn`, ajeno al proyecto. Tras cada `add` hay que apuntar el import a nuestro
// `@/modules/core/utils/cn` y quitar la dependencia. Este test lo vigila.
const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const packageJson = JSON.parse(readFileSync(path.resolve(srcDir, "../package.json"), "utf8")) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

describe("componentes de shadcn", () => {
  it("usan el cn del proyecto, no el paquete npm `cn`", () => {
    const offenders = readdirSync(srcDir, { recursive: true, encoding: "utf8" })
      .filter((file) => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file))
      .filter((file) => /from\s+["']cn["']/.test(readFileSync(path.join(srcDir, file), "utf8")));

    expect(offenders).toEqual([]);
    expect(packageJson.dependencies?.cn).toBeUndefined();
    expect(packageJson.devDependencies?.cn).toBeUndefined();
  });
});
