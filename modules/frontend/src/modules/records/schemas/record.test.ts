import { describe, expect, it } from "vitest";
import { recordFormSchema, type RecordFormValues } from "./record";
import { emptyRecordValues } from "../utils/recordForm";

function values(overrides: Partial<RecordFormValues> = {}, content: Record<string, unknown> = {}): RecordFormValues {
  const base = emptyRecordValues("Dra. Torres");
  return {
    ...base,
    recordNumber: "AOC-0015",
    patientName: "Ana Quispe",
    ...overrides,
    content: { ...base.content, ...content } as RecordFormValues["content"],
  };
}

function errorsOf(input: RecordFormValues): Record<string, string> {
  const result = recordFormSchema.safeParse(input);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((i) => [i.path.join("."), i.message]));
}

describe("orthodontic-records — schema del formulario (paridad con el backend)", () => {
  it("bastan el número y el nombre del paciente (borrador)", () => {
    expect(errorsOf(values())).toEqual({});
  });

  it("número de historia obligatorio y con el formato AOC-0001", () => {
    expect(errorsOf(values({ recordNumber: "  " }))).toEqual({ recordNumber: "Indica el número de historia." });
    for (const invalid of ["AOC-15", "AOC-00001", "AEO-0015", "aoc-0015"]) {
      expect(errorsOf(values({ recordNumber: invalid }))).toEqual({ recordNumber: "Usa el formato AOC-0001." });
    }
  });

  it("fecha de la primera menstruación: no futura ni anterior al nacimiento, solo si aplica", () => {
    const female = { patientSex: "FEMALE" as const, birthDate: "2012-05-20" };
    const anamnesis = (menarche: "YES" | "NO", menarcheDate: string) => ({
      anamnesis: { ...emptyRecordValues().content.anamnesis, menarche, menarcheDate },
    });
    const path = "content.anamnesis.menarcheDate";
    expect(errorsOf(values(female, anamnesis("YES", "2023-03-15")))).toEqual({});
    expect(errorsOf(values(female, anamnesis("YES", "2099-01-01")))).toEqual({
      [path]: "La fecha de la primera menstruación no puede ser futura.",
    });
    expect(errorsOf(values(female, anamnesis("YES", "2010-01-01")))).toEqual({
      [path]: "La fecha de la primera menstruación no puede ser anterior a la de nacimiento.",
    });
    // Con "No" o sin sexo femenino la fecha no aplica (el servidor la descarta al guardar).
    expect(errorsOf(values(female, anamnesis("NO", "2099-01-01")))).toEqual({});
    expect(errorsOf(values({ patientSex: "MALE", birthDate: "2012-05-20" }, anamnesis("YES", "2099-01-01")))).toEqual({});
  });

  it("nombre vacío o solo espacios: error en el campo", () => {
    expect(errorsOf(values({ patientName: "   " }))).toEqual({ patientName: "Indica el nombre del paciente." });
  });

  it("documento válido según su tipo", () => {
    expect(errorsOf(values({ documentType: "DNI", documentNumber: "74125896" }))).toEqual({});
    expect(errorsOf(values({ documentType: "FOREIGNER_CARD", documentNumber: "001234567" }))).toEqual({});
    expect(errorsOf(values({ documentType: "PASSPORT", documentNumber: "12345678" }))).toEqual({});
  });

  it("documento con formato incorrecto: error en el número", () => {
    expect(errorsOf(values({ documentType: "DNI", documentNumber: "7412589" }))).toEqual({ documentNumber: "El DNI debe tener 8 dígitos." });
    expect(errorsOf(values({ documentType: "FOREIGNER_CARD", documentNumber: "00123456A" })).documentNumber).toBeDefined();
    expect(errorsOf(values({ documentType: "PASSPORT", documentNumber: "AB1234" })).documentNumber).toBeDefined();
    expect(errorsOf(values({ documentType: "PASSPORT", documentNumber: "12345" })).documentNumber).toBeDefined();
  });

  it("número sin tipo o tipo sin número", () => {
    expect(errorsOf(values({ documentNumber: "74125896" }))).toEqual({ documentType: "Indica el tipo de documento." });
    expect(errorsOf(values({ documentType: "DNI" }))).toEqual({ documentNumber: "Indica el número del documento." });
  });

  it("fecha de nacimiento futura e inicio anterior al nacimiento", () => {
    expect(errorsOf(values({ birthDate: "2999-01-01" })).birthDate).toBe("La fecha de nacimiento no puede ser futura.");
    expect(errorsOf(values({ birthDate: "2012-05-20", treatmentStartDate: "2012-05-19" })).treatmentStartDate)
      .toBe("La fecha de inicio de tratamiento no puede ser anterior a la de nacimiento.");
  });

  it("texto largo por encima del límite", () => {
    const out = errorsOf(values({}, { anamnesis: { chiefComplaint: "x".repeat(4001) } }));
    expect(out["content.anamnesis.chiefComplaint"]).toBe("Máximo 4000 caracteres.");
  });

  it("porcentaje y milímetros fuera de rango o con más de un decimal", () => {
    expect(errorsOf(values({}, { occlusal: { deepBitePercent: 101 } }))["content.occlusal.deepBitePercent"]).toBeDefined();
    expect(errorsOf(values({}, { occlusal: { overjetMm: 31 } }))["content.occlusal.overjetMm"]).toBeDefined();
    expect(errorsOf(values({}, { occlusal: { openBiteMm: 2.25 } }))["content.occlusal.openBiteMm"]).toBe("Máximo un decimal.");
    expect(errorsOf(values({}, { occlusal: { deepBitePercent: 40, openBiteMm: 3, overjetMm: 5.5 } }))).toEqual({});
  });

  it("línea media desviada exige al menos 0,5 mm", () => {
    const deviated = (mm?: number) => values({}, { occlusal: { midlineLower: { position: "DEVIATED_LEFT", deviationMm: mm } } });
    expect(errorsOf(deviated(0.4))["content.occlusal.midlineLower.deviationMm"]).toBeDefined();
    expect(errorsOf(deviated())["content.occlusal.midlineLower.deviationMm"]).toBeDefined();
    expect(errorsOf(deviated(2))).toEqual({});
    expect(errorsOf(values({}, { occlusal: { midlineUpper: { position: "CENTERED" } } }))).toEqual({});
  });

  it("piezas FDI válidas (anteriores donde corresponde)", () => {
    expect(errorsOf(values({}, { functional: { bruxismTeeth: [13, 26, 55] } }))).toEqual({});
    expect(errorsOf(values({}, { functional: { bruxismTeeth: [16, 49] } }))["content.functional.bruxismTeeth.1"]).toBeDefined();
    expect(errorsOf(values({}, { occlusal: { anteriorCrossbiteTeeth: [14] } }))["content.occlusal.anteriorCrossbiteTeeth.0"]).toBeDefined();
  });

  it("listas: máximo 30 ítems de 500 caracteres", () => {
    const many = Array.from({ length: 31 }, () => "p");
    expect(errorsOf(values({}, { diagnosis: { problemList: many } }))["content.diagnosis.problemList"]).toBeDefined();
    expect(errorsOf(values({}, { diagnosis: { treatmentGoals: ["x".repeat(501)] } }))["content.diagnosis.treatmentGoals.0"]).toBeDefined();
  });
});
