import { describe, expect, it } from "vitest";
import { fitScale } from "./fitScale";

describe("fitScale", () => {
  it("reduce lo justo para caber en el ancho disponible", () => {
    expect(fitScale(375, 794)).toBe(0.472);
    expect(fitScale(768, 794)).toBe(0.967);
  });

  it("nunca agranda ni divide por cero", () => {
    expect(fitScale(1280, 794)).toBe(1);
    expect(fitScale(0, 794)).toBe(1);
  });
});
