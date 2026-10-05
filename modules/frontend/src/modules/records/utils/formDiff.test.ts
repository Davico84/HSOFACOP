import { describe, expect, it } from "vitest";
import { diffPaths, relatedPaths, valueAt } from "./formDiff";

describe("formDiff", () => {
  it("lista las hojas que cambian; un array cuenta como hoja", () => {
    const before = { a: 1, b: { c: "x", d: [1, 2] }, e: null };
    const after = { a: 1, b: { c: "y", d: [1, 2, 3] }, e: { f: 1 } };
    expect(diffPaths(before, after)).toEqual(["b.c", "b.d", "e"]);
    expect(diffPaths(before, structuredClone(before))).toEqual([]);
  });

  it("relaciona una ruta con sus padres e hijos, no con hermanas", () => {
    expect(relatedPaths("models.nance", "models.nance.date")).toBe(true);
    expect(relatedPaths("models.nance.date", "models.nance")).toBe(true);
    expect(relatedPaths("models.nance", "models.nanceX")).toBe(false);
  });

  it("lee el valor de una ruta", () => {
    expect(valueAt({ a: { b: { c: 3 } } }, "a.b.c")).toBe(3);
    expect(valueAt({ a: null }, "a.b")).toBeUndefined();
  });
});
