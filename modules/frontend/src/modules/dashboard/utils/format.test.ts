import { describe, expect, it } from "vitest";
import { formatAverage, historias, monthLabel, monthLongLabel } from "./format";

describe("dashboard — formatos", () => {
  it("rotula el mes partiendo el texto (sin new Date, que en Perú caería en el mes anterior)", () => {
    expect(monthLabel("2026-05")).toBe("may");
    expect(monthLabel("2026-01")).toBe("ene");
    expect(monthLongLabel("2026-12")).toBe("diciembre de 2026");
  });

  it("promedio con un decimal y '—' si no hay", () => {
    expect(formatAverage(5.5)).toBe("5,5");
    expect(formatAverage(7)).toBe("7,0");
    expect(formatAverage(null)).toBe("—");
    expect(formatAverage(undefined)).toBe("—");
  });

  it("singular y plural", () => {
    expect(historias(1)).toBe("1 historia");
    expect(historias(0)).toBe("0 historias");
  });
});
