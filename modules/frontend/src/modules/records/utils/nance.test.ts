import { describe, expect, it } from "vitest";
import { LOWER_NANCE_TEETH, UPPER_NANCE_TEETH } from "../config/nance";
import { archTotal, discrepancy, measuredTeeth } from "./nance";

const upper = { tooth15: 7.0, tooth14: 7.1, tooth13: 7.8, tooth12: 6.7, tooth11: 8.6, tooth21: 8.5, tooth22: 6.6, tooth23: 7.7, tooth24: 7.0, tooth25: 6.9 };

describe("análisis de Nance", () => {
  it("ST = suma de las 10 piezas y discrepancia SA − ST", () => {
    expect(archTotal(upper, UPPER_NANCE_TEETH)).toBe(73.9);
    expect(discrepancy(70.5, 73.9)).toBe(-3.4);
    expect(discrepancy(75, 73.9)).toBe(1.1);
  });

  it("si falta una pieza no hay ST ni discrepancia", () => {
    const missing = { ...upper, tooth23: null };
    expect(archTotal(missing, UPPER_NANCE_TEETH)).toBeNull();
    expect(measuredTeeth(missing, UPPER_NANCE_TEETH)).toBe(9);
    expect(discrepancy(70.5, null)).toBeNull();
    expect(discrepancy(null, 73.9)).toBeNull();
  });

  it("cada arcada usa sus propias piezas", () => {
    expect(archTotal(upper, LOWER_NANCE_TEETH)).toBeNull();
    expect(measuredTeeth(undefined, LOWER_NANCE_TEETH)).toBe(0);
  });
});
