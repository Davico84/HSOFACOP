import { describe, expect, it } from "vitest";
import { WALA_EV_NORMS } from "../config/transversal";
import { difference, formatComparison, formatMm, formatSigned, intermolarComparison } from "./transversal";

describe("orthodontic-records — Análisis transversal de los modelos (cálculos)", () => {
  it("diferencia con el promedio según el sexo: mujer AMS 50,1 y AMI 45,8", () => {
    expect(formatComparison(intermolarComparison(50.1, "upper", "FEMALE"))).toBe("promedio 52,4 mm · −2,3");
    expect(formatComparison(intermolarComparison(45.8, "lower", "FEMALE"))).toBe("promedio 46,1 mm · −0,3");
    expect(formatComparison(intermolarComparison(55.0, "upper", "MALE"))).toBe("promedio 54,0 mm · +1,0");
  });

  it("sin sexo indicado no hay comparación", () => {
    expect(intermolarComparison(50.1, "upper", null)).toBeNull();
    expect(formatComparison(null)).toBe("");
  });

  it("sin medida se muestra solo el promedio", () => {
    expect(formatComparison(intermolarComparison(null, "upper", "FEMALE"))).toBe("promedio 52,4 mm");
  });

  it("diferencia WALA–EV contra su norma: 1er molar 2,6 → +0,6; sin valor no hay diferencia", () => {
    const firstMolar = WALA_EV_NORMS.find((n) => n.key === "firstMolar")!;
    expect(firstMolar.norm).toBe(2.0);
    expect(formatSigned(difference(2.6, firstMolar.norm))).toBe("+0,6");
    expect(formatSigned(difference(1.0, 1.3))).toBe("−0,3");
    expect(formatSigned(difference(0.6, 0.6))).toBe("0,0");
    expect(difference(null, 2.2)).toBeNull();
    expect(formatSigned(null)).toBe("");
  });

  it("normas del PDF en orden: 0,6 / 0,8 / 1,3 / 2,0 / 2,2", () => {
    expect(WALA_EV_NORMS.map((n) => n.norm)).toEqual([0.6, 0.8, 1.3, 2.0, 2.2]);
    expect(formatMm(50)).toBe("50,0");
  });
});
