import { describe, expect, it } from "vitest";
import { ageYears, isMinor } from "./age";
import { formatTeeth, isValidFdi } from "./fdi";
import { formatAge, formatDate, formatDocument } from "./recordDisplay";
import { toFormValues, toUpdateRequest } from "./recordForm";
import { recordResponse } from "../test/fixtures";

describe("orthodontic-records — edad calculada (misma regla que el backend)", () => {
  it("a la fecha de inicio cuenta años cumplidos", () => {
    expect(ageYears("2012-05-20", "2026-05-19")).toBe(13);
    expect(ageYears("2012-05-20", "2026-05-20")).toBe(14);
  });

  it("sin inicio usa hoy; sin nacimiento no hay edad", () => {
    expect(ageYears("2012-05-20", null, "2026-10-01")).toBe(14);
    expect(ageYears(null, "2026-05-19")).toBeNull();
  });

  it("menor de edad solo si la edad se conoce y es < 18", () => {
    expect(isMinor(17)).toBe(true);
    expect(isMinor(18)).toBe(false);
    expect(isMinor(null)).toBe(false);
  });
});

describe("orthodontic-records — notación FDI", () => {
  it("permanentes 11–48 y temporales 51–85", () => {
    expect([11, 18, 48, 51, 55, 85].every((t) => isValidFdi(t))).toBe(true);
    expect([10, 19, 49, 50, 56, 86, 91].some((t) => isValidFdi(t))).toBe(false);
  });

  it("anteriores: solo incisivos y caninos", () => {
    expect(isValidFdi(13, true)).toBe(true);
    expect(isValidFdi(14, true)).toBe(false);
  });

  it("se imprimen ordenadas", () => {
    expect(formatTeeth([26, 13, 55])).toBe("13, 26, 55");
    expect(formatTeeth(null)).toBe("");
  });
});

describe("orthodontic-records — presentación", () => {
  it("fechas, documento y edad", () => {
    expect(formatDate("2026-05-19")).toBe("19/05/2026");
    expect(formatDocument("FOREIGNER_CARD", "001234567")).toBe("CE 001234567");
    expect(formatDocument("DNI", null)).toBe("");
    expect(formatAge(13)).toBe("13 años");
    expect(formatAge(null)).toBe("");
  });
});

describe("orthodontic-records — conversión del formulario", () => {
  it("los null del servidor no llegan al formulario y lo vacío no se envía", () => {
    const values = toFormValues(recordResponse({ address: "Av. Ejército 512" }));
    expect(values.birthPlace).toBeUndefined();
    const request = toUpdateRequest({ ...values, phone: "" }, 3);
    expect(request.version).toBe(3);
    expect(request.address).toBe("Av. Ejército 512");
    expect("phone" in request).toBe(false);
    expect("recordNumber" in request).toBe(false);
  });
});
