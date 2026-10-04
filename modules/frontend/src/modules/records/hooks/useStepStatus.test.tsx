import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import type { RecordFormValues } from "../schemas/record";
import { emptyRecordValues } from "../utils/recordForm";
import { errorPaths, useStepStatus } from "./useStepStatus";

/** Formulario de historia con valores iniciales; expone `form` para tocarlo desde el test. */
function setup(patch: (v: RecordFormValues) => void = () => undefined) {
  const values = emptyRecordValues();
  patch(values);
  let form!: UseFormReturn<RecordFormValues>;
  function Wrapper({ children }: { children: ReactNode }) {
    form = useForm<RecordFormValues>({ defaultValues: values });
    return <FormProvider {...form}>{children}</FormProvider>;
  }
  const hook = renderHook(() => useStepStatus(), { wrapper: Wrapper });
  return { hook, form: () => form };
}

describe("useStepStatus", () => {
  it("historia nueva: todos vacíos (los valores por defecto no cuentan) y 0 de 8", () => {
    const { hook } = setup();
    expect(Object.values(hook.result.current.steps).map((s) => s.status)).toEqual(Array(8).fill("empty"));
    expect(hook.result.current.progressText).toBe("0 de 8 pasos con datos");
  });

  it("con datos en los pasos 1, 2 y 4: esos 'con datos', los demás vacíos, 3 de 8", () => {
    const { hook } = setup((v) => {
      v.patientName = "Ana";
      v.content.facial.facialType = "MESOFACIAL";
      v.content.occlusal.overjetMm = 3;
    });
    const { steps, progressText } = hook.result.current;
    expect([1, 2, 4].map((n) => steps[n].status)).toEqual(["filled", "filled", "filled"]);
    expect([3, 5, 6, 7, 8].map((n) => steps[n].status)).toEqual(Array(5).fill("empty"));
    expect(progressText).toBe("3 de 8 pasos con datos");
  });

  it("un error del servidor en un campo del paso 7 lo marca 'con errores' aunque tenga datos", () => {
    const { hook, form } = setup((v) => {
      v.content.diagnosis.generalDiagnosis = "Clase II";
    });
    expect(hook.result.current.steps[7].status).toBe("filled");

    act(() => form().setError("content.diagnosis.generalDiagnosis", { type: "server", message: "Máximo 4000 caracteres." }));
    expect(hook.result.current.steps[7]).toEqual({ status: "error", hasData: true, hasErrors: true });
    expect(hook.result.current.withData).toBe(1);
  });

  it("al escribir el primer dato de un paso, pasa a 'con datos' sin guardar", () => {
    const { hook, form } = setup();
    act(() => form().setValue("content.radiographic.panoramicDiagnosis", "Dentición mixta"));
    expect(hook.result.current.steps[6].status).toBe("filled");
    expect(hook.result.current.progressText).toBe("1 de 8 pasos con datos");
  });

  it("errorPaths aplana los errores anidados", () => {
    expect(
      errorPaths({
        patientName: { type: "required", message: "Obligatorio" },
        content: { models: { nance: { upperWidths: { tooth11: { type: "min", message: "Mínimo 4 mm." } } } } },
      }),
    ).toEqual(["patientName", "content.models.nance.upperWidths.tooth11"]);
  });
});
