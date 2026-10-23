import { describe, expect, it } from "vitest";
import { recordFormSchema } from "../schemas/record";
import { emptyContent } from "./recordForm";
import { effectiveSum, formatSigned } from "./suggestedSum";
import { tanakaResult, tanakaSuggestedSum } from "./tanaka";
import { WOLFORD_TEETH, wolfordResult, wolfordSuggestedSum } from "./wolford";

const nanceUpper = { tooth15: 6.8, tooth14: 7.1, tooth13: 7.9, tooth12: 6.6, tooth11: 8.6, tooth21: 8.6, tooth22: 6.7, tooth23: 7.9, tooth24: 7.0, tooth25: 6.8 };
const nanceLower = { tooth45: 7.1, tooth44: 7.0, tooth43: 6.9, tooth42: 9.9, tooth41: 9.9, tooth31: 9.9, tooth32: 9.9, tooth33: 6.9, tooth34: 7.1, tooth35: 7.1 };
const bolton = {
  firstMolars: { tooth16: 10.8, tooth26: 11.2, tooth46: 11.0, tooth36: 11.9 },
  incisors: { tooth12: 6.6, tooth11: 8.6, tooth21: 8.6, tooth22: 6.7, tooth42: 6.0, tooth41: 5.4, tooth31: 5.5, tooth32: 6.1 },
};
const models = { nance: { upperWidths: nanceUpper, lowerWidths: nanceLower }, bolton };

describe("Cálculos de Tanaka-Johnston", () => {
  it("Espacio previsto: suma 23,0 → MAX 22,5 y MAND 22,0", () => {
    expect(tanakaResult(23.0)).toEqual({ maxilla: 22.5, mandible: 22.0 });
  });

  it("Redondeo: suma 23,3 → MAX 22,7 y MAND 22,2 (la mitad hacia arriba)", () => {
    expect(tanakaResult(23.3)).toEqual({ maxilla: 22.7, mandible: 22.2 });
  });

  it("Sin suma: nada", () => {
    expect(tanakaResult(null)).toBeNull();
  });
});

describe("Sumas sugeridas de Tanaka-Johnston", () => {
  it("Suma tomada de Moyers: 6,0 + 5,5 + 5,4 + 6,1 = 23,0", () => {
    expect(tanakaSuggestedSum({ tooth42: 6.0, tooth41: 5.5, tooth31: 5.4, tooth32: 6.1 })).toEqual({ value: 23.0, reason: "ok" });
  });

  it("Tanaka no usa los incisivos de Nance ni de Bolton: con Moyers vacío, sin sugerencia", () => {
    expect(tanakaSuggestedSum({})).toEqual({ value: null, reason: "missing" });
  });

  it("Ancho fuente fuera de rango: sin sugerencia", () => {
    expect(tanakaSuggestedSum({ tooth42: 3.0, tooth41: 5.5, tooth31: 5.4, tooth32: 6.1 })).toEqual({ value: null, reason: "outOfRange" });
  });

  it("Suma escrita por el tratante: se usa la escrita; sin escribir, la sugerida", () => {
    const suggested = tanakaSuggestedSum({ tooth42: 6.0, tooth41: 5.5, tooth31: 5.4, tooth32: 6.1 });
    expect(effectiveSum(23.5, suggested)).toBe(23.5);
    expect(effectiveSum(null, suggested)).toBe(23.0);
  });
});

describe("Cálculos de Wolford", () => {
  it("Discrepancias: 96,0 − 88,0 × 1,1 = −0,8 y 46,0 − 35,0 × 1,3 = +0,5", () => {
    const r = wolfordResult({ upper12Sum: 96.0, lower12Sum: 88.0, upper6Sum: 46.0, lower6Sum: 35.0 });
    expect(r).toEqual({ total: -0.8, partial: 0.5 });
    expect(formatSigned(r.total!)).toBe("−0,8");
    expect(formatSigned(r.partial!)).toBe("+0,5");
  });

  it("Falta una suma: la parcial queda vacía y la total se calcula", () => {
    expect(wolfordResult({ upper12Sum: 96.0, lower12Sum: 88.0, upper6Sum: 46.0, lower6Sum: null })).toEqual({ total: -0.8, partial: null });
  });

  it("Redondeo de negativos alejándose de cero: 46,0 − 36,8 × 1,3 = −1,84 → −1,8; 10,0 − 7,5 × 1,3 = 0,25 → 0,3; −0,65 → −0,7", () => {
    expect(wolfordResult({ upper12Sum: null, lower12Sum: null, upper6Sum: 46.0, lower6Sum: 36.8 }).partial).toBe(-1.8);
    expect(wolfordResult({ upper12Sum: null, lower12Sum: null, upper6Sum: 10.0, lower6Sum: 7.5 }).partial).toBe(0.3);
    // 0,0 − 0,5 × 1,3 = −0,65: la mitad se aleja de cero → −0,7 (no −0,6 como haría Math.round).
    expect(wolfordResult({ upper12Sum: null, lower12Sum: null, upper6Sum: 0, lower6Sum: 0.5 }).partial).toBe(-0.7);
  });
});

describe("Sumas sugeridas de Wolford", () => {
  it("Piezas de cada suma", () => {
    expect(WOLFORD_TEETH.upper12Sum).toEqual([16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26]);
    expect(WOLFORD_TEETH.lower12Sum).toEqual([46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36]);
    expect(WOLFORD_TEETH.upper6Sum).toEqual([13, 12, 11, 21, 22, 23]);
    expect(WOLFORD_TEETH.lower6Sum).toEqual([43, 42, 41, 31, 32, 33]);
  });

  it("Incisivos y molares de Bolton, caninos y premolares de Nance (los incisivos de Nance no cuentan)", () => {
    expect(wolfordSuggestedSum(models, "upper12Sum")).toEqual({ value: 96.0, reason: "ok" });
    expect(wolfordSuggestedSum(models, "lower12Sum")).toEqual({ value: 88.0, reason: "ok" });
    expect(wolfordSuggestedSum(models, "upper6Sum")).toEqual({ value: 46.3, reason: "ok" });
    expect(wolfordSuggestedSum(models, "lower6Sum")).toEqual({ value: 36.8, reason: "ok" });
  });

  it("Faltan anchos: sin sugerencia", () => {
    const missing = { ...models, bolton: { ...bolton, firstMolars: { ...bolton.firstMolars, tooth16: null } } };
    expect(wolfordSuggestedSum(missing, "upper12Sum")).toEqual({ value: null, reason: "missing" });
    expect(wolfordSuggestedSum(missing, "upper6Sum").reason).toBe("ok");
  });

  it("Ancho fuente fuera de rango: sin sugerencia y sin tocar el dato", () => {
    const out = { ...models, bolton: { ...bolton, firstMolars: { ...bolton.firstMolars, tooth16: 14.5 } } };
    expect(wolfordSuggestedSum(out, "upper12Sum")).toEqual({ value: null, reason: "outOfRange" });
    expect(out.bolton.firstMolars.tooth16).toBe(14.5);
  });
});

describe("Schema de Tanaka-Johnston y Wolford (paridad con el backend)", () => {
  const errorsFor = (tanaka: object, wolford: object) => {
    const content = emptyContent();
    const values = { recordNumber: "AEO-0001", patientName: "Ana", content: { ...content, models: { ...content.models, tanaka, wolford } } };
    const result = recordFormSchema.safeParse(values);
    return result.success ? [] : result.error.issues.map((i) => i.path.join("."));
  };

  it("Datos válidos, incluido el máximo de 12 piezas (199,9)", () => {
    expect(errorsFor({ incisorSum: 23.0 }, { upper12Sum: 199.9, lower12Sum: 0, upper6Sum: 99.9, lower6Sum: null })).toEqual([]);
  });

  it("Suma fuera de rango o con dos decimales: error en su campo", () => {
    expect(errorsFor({ incisorSum: 100 }, { upper12Sum: 200, lower12Sum: -1, upper6Sum: 100, lower6Sum: 35.25 })).toEqual([
      "content.models.tanaka.incisorSum",
      "content.models.wolford.upper12Sum",
      "content.models.wolford.lower12Sum",
      "content.models.wolford.upper6Sum",
      "content.models.wolford.lower6Sum",
    ]);
  });
});
