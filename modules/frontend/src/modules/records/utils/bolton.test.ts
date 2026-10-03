import { describe, expect, it } from "vitest";
import { BOLTON_RATIOS, boltonWidth } from "../config/bolton";
import { boltonResult, sumWidths } from "./bolton";

const [total, anterior] = BOLTON_RATIOS;

describe("análisis de Bolton", () => {
  it("relación total 87,5 / 94,2 → 92,9 %, ideal mandibular 86,0 y diferencia +1,5", () => {
    const widths: Record<number, number> = {};
    total.upper.forEach((t, i) => (widths[t] = i === 0 ? 94.2 - 11 * 7.8 : 7.8));
    total.lower.forEach((t, i) => (widths[t] = i === 0 ? 87.5 - 11 * 7.3 : 7.3));
    const r = boltonResult(total, (t) => widths[t]);
    expect(r.maxillary).toBe(94.2);
    expect(r.mandibular).toBe(87.5);
    expect(r.ratio).toBe(92.9);
    expect(r.inRange).toBe(true);
    expect(r).toMatchObject({ excess: "mandibular", actual: 87.5, ideal: 86, difference: 1.5 });
  });

  it("relación anterior 36,0 / 48,0 → 75,0 %, exceso maxilar: ideal 46,6 y diferencia +1,4", () => {
    const r = boltonResult(anterior, (t) => (anterior.lower.includes(t) ? 6 : anterior.upper.includes(t) ? 8 : null));
    expect(r).toMatchObject({ mandibular: 36, maxillary: 48, ratio: 75, inRange: true, excess: "maxillary", actual: 48, ideal: 46.6, difference: 1.4 });
  });

  it("fuera del rango y en la media exacta", () => {
    const out = boltonResult(total, (t) => (total.lower.includes(t) ? 8 : total.upper.includes(t) ? 8.3333 : null));
    expect(out.inRange).toBe(false);
    // 38,6 / 50,0 = 77,2 %: justo la media.
    const lower = (t: number) => (t === 43 ? 6.6 : 6.4);
    const upper = (t: number) => (t === 13 ? 8.5 : 8.3);
    const atMean = boltonResult(anterior, (t) => (anterior.lower.includes(t) ? lower(t) : anterior.upper.includes(t) ? upper(t) : null));
    expect(atMean.ratio).toBe(77.2);
    expect(atMean).toMatchObject({ excess: null, actual: null, ideal: null, difference: null });
  });

  it("si falta una pieza no hay relación", () => {
    expect(sumWidths([11, 21], (t) => (t === 11 ? 8.6 : null))).toBeNull();
    expect(boltonResult(anterior, () => null)).toMatchObject({ ratio: null, excess: null });
  });

  it("los molares salen de Bolton y el resto de Nance", () => {
    const models = { nance: { upperWidths: { tooth11: 8.6 }, lowerWidths: { tooth31: 5.4 } }, bolton: { firstMolars: { tooth16: 10.2 } } };
    expect(boltonWidth(models, 16)).toBe(10.2);
    expect(boltonWidth(models, 11)).toBe(8.6);
    expect(boltonWidth(models, 31)).toBe(5.4);
    expect(boltonWidth(models, 26)).toBeUndefined();
  });
});
