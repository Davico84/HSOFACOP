import { describe, expect, it } from "vitest";
import * as options from "./options";
import {
  FacialAnalysisFacialPattern,
  FunctionalAnalysisSuckingHabitTypesItem,
  OcclusalAnalysisTransverse,
} from "@/modules/core/services/generated/model";

const optionLists = Object.entries(options).filter(
  ([name, value]) => name.endsWith("Options") && Array.isArray(value),
) as [string, { value: string; label: string; image?: string }[]][];

describe("orthodontic-records — etiquetas de las opciones (única fuente para formulario e impresión)", () => {
  it("cada lista de opciones tiene etiquetas en español no vacías y sin valores repetidos", () => {
    expect(optionLists.length).toBeGreaterThan(30);
    for (const [name, list] of optionLists) {
      expect(list.length, name).toBeGreaterThan(1);
      expect(new Set(list.map((o) => o.value)).size, name).toBe(list.length);
      for (const o of list) expect(o.label.trim(), `${name}.${o.value}`).not.toBe("");
    }
  });

  it("las opciones cubren todos los valores del contrato, en el orden del PDF", () => {
    expect(options.facialPatternOptions.map((o) => o.value)).toEqual(Object.values(FacialAnalysisFacialPattern));
    expect(options.suckingHabitOptions.map((o) => o.value)).toEqual(Object.values(FunctionalAnalysisSuckingHabitTypesItem));
    expect(options.transverseOptions.map((o) => o.value)).toEqual(Object.values(OcclusalAnalysisTransverse));
  });

  it("las preguntas con ilustración de la guía facial traen una imagen por opción", () => {
    for (const list of [options.facialTypeOptions, options.convexityOptions, options.lipRelationOptions,
      options.zygomaticOptions, options.facialPatternOptions]) {
      for (const o of list) expect(o.image, o.value).toBeTruthy();
    }
  });

  it("labelOf devuelve la etiqueta o vacío", () => {
    expect(options.labelOf(options.yesNoOptions, "YES")).toBe("Sí");
    expect(options.labelOf(options.yesNoOptions, null)).toBe("");
  });
});
