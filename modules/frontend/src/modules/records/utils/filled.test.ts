import { describe, expect, it } from "vitest";
import { countFilled, filledLabel } from "./filled";

describe("datos registrados de un bloque", () => {
  it("cuenta las hojas con valor en cualquier nivel; vacíos y nulos no cuentan", () => {
    expect(countFilled({ a: null, b: "", c: { d: 0, e: "texto", f: [] } })).toBe(2);
    expect(countFilled({ walaToEv: { canine: 0.8 }, teeth: [16] })).toBe(2);
    expect(countFilled(undefined)).toBe(0);
  });

  it("texto del estado", () => {
    expect(filledLabel(0)).toBe("Sin datos");
    expect(filledLabel(1)).toBe("1 dato");
    expect(filledLabel(6)).toBe("6 datos");
  });
});
