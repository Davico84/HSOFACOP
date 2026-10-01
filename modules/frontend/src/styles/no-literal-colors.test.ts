/// <reference types="node" />
// Test de Node (fs/path): corre en Vitest, no en el navegador.
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Scenario "Sin colores literales en componentes" (project-foundation): los colores
// salen solo de los tokens de globals.css; cambiar la marca = editar ese archivo.
const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const LITERAL_COLOR = /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|\brgba?\(|\bhsla?\(/gi;

function sourceFiles(): string[] {
  return readdirSync(srcDir, { recursive: true, encoding: "utf8" })
    .filter((file) => /\.tsx?$/.test(file))
    .filter((file) => !/\.test\.tsx?$/.test(file))
    .filter((file) => !file.split(path.sep).join("/").includes("services/generated/"));
}

describe("project-foundation — Tema definido por tokens CSS", () => {
  it("Sin colores literales en componentes: ningún .ts/.tsx de src contiene hex, rgb() ni hsl()", () => {
    const files = sourceFiles();
    expect(files.length).toBeGreaterThan(20); // el recorrido encontró el código de verdad

    const offenders = files.flatMap((file) => {
      const lines = readFileSync(path.join(srcDir, file), "utf8").split("\n");
      return lines.flatMap((line, i) =>
        line.match(LITERAL_COLOR) ? [`${file}:${i + 1}: ${line.trim()}`] : [],
      );
    });

    expect(offenders).toEqual([]);
  });
});
