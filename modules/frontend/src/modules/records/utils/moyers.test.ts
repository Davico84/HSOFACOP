import { describe, expect, it } from "vitest";
import { incisorSum, moyersResult, requiredSpace, roundToHalf } from "./moyers";

const incisors = { tooth42: 6.0, tooth41: 5.5, tooth31: 5.4, tooth32: 6.1 };

describe("análisis de Moyers", () => {
  it("suma de anteriores y requerido al 75 % por arcada", () => {
    expect(incisorSum(incisors)).toBe(23);
    expect(requiredSpace(23)).toEqual({ mandible: 22.2, maxilla: 22.6 });
  });

  it("la suma se redondea al 0,5 más cercano", () => {
    expect(roundToHalf(23.3)).toBe(23.5);
    expect(roundToHalf(23.2)).toBe(23);
    expect(requiredSpace(23.3)).toEqual({ mandible: 22.5, maxilla: 22.9 });
  });

  it("sin los cuatro incisivos o fuera de la tabla no hay requerido", () => {
    expect(incisorSum({ ...incisors, tooth32: null })).toBeNull();
    expect(moyersResult({ ...incisors, tooth32: null }, { mandibleRight: 21 }).outOfRange).toBe(false);
    const low = moyersResult({ tooth42: 4.5, tooth41: 4.5, tooth31: 4.5, tooth32: 5.5 }, { mandibleRight: 21 });
    expect(low.sum).toBe(19);
    expect(low.outOfRange).toBe(true);
    expect(low.sides[0]).toMatchObject({ required: null, difference: null });
    expect(requiredSpace(29.3)).toBeNull();
    expect(requiredSpace(29.2)).toEqual({ mandible: 25.7, maxilla: 25.9 });
  });

  it("diferencia disponible − requerido", () => {
    const r = moyersResult(incisors, { mandibleRight: 21.0, mandibleLeft: 22.6, maxillaRight: 23.5, maxillaLeft: 22.6 });
    expect(r.sides.map((s) => s.difference)).toEqual([-1.2, 0.4, 0.9, 0]);
  });

  it("un lado sin espacio disponible no tiene diferencia", () => {
    const r = moyersResult(incisors, { mandibleRight: 21.0 });
    expect(r.sides[1]).toMatchObject({ available: null, required: 22.2, difference: null });
    expect(r.sides[0].difference).toBe(-1.2);
  });
});
