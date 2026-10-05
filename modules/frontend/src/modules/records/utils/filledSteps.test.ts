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
});
