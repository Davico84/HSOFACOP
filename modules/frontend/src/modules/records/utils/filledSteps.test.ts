import { describe, expect, it } from "vitest";
import { emptyRecordValues } from "./recordForm";
import { filledStepsOf } from "./filledSteps";

describe("orthodontic-records — Pasos con datos guardados con la historia", () => {
  it("una historia nueva no tiene pasos con datos (los valores por defecto no cuentan)", () => {
    expect(filledStepsOf(emptyRecordValues())).toEqual([]);
  });

  it("cuenta el paso de cada campo con datos", () => {
    const values = emptyRecordValues("Dra. María Torres");
    values.patientName = "Ana Quispe";
    values.content.facial.facialThirdsNotes = "Tercio inferior aumentado";
    values.content.diagnosis.problemList = ["Overjet aumentado"];

    expect(filledStepsOf(values)).toEqual([1, 2, 7]);
  });

  it("Lo sugerido no cuenta como dato: Tanaka y Wolford solo cuentan sumas escritas e interpretación", () => {
    // Las sumas sugeridas nunca entran al formulario: sin escribir, quedan nulas.
    const suggestedOnly = emptyRecordValues();
    suggestedOnly.content.models.tanaka = { incisorSum: null, interpretation: "" };
    suggestedOnly.content.models.wolford = { upper12Sum: null, lower12Sum: null, upper6Sum: null, lower6Sum: null, interpretation: "" };
    expect(filledStepsOf(suggestedOnly)).toEqual([]);

    const written = emptyRecordValues();
    written.content.models.wolford = { upper12Sum: 94.2 };
    expect(filledStepsOf(written)).toEqual([5]);

    const interpreted = emptyRecordValues();
    interpreted.content.models.tanaka = { interpretation: "Espacio suficiente" };
    expect(filledStepsOf(interpreted)).toEqual([5]);
  });
});
