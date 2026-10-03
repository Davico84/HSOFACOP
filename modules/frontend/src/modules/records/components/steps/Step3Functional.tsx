import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { ChoiceField } from "@/modules/core/components/form/ChoiceField";
import { ChoiceMatrix } from "@/modules/core/components/form/ChoiceMatrix";
import { MultiChoiceField } from "@/modules/core/components/form/MultiChoiceField";
import type { RecordFormValues } from "../../schemas/record";
import {
  breathingOptions, bruxismOptions, frenulumOptions, HEART_TEST_NOTE, lipClosureOptions, muscleOptions,
  sideOptions, suckingHabitOptions, swallowingOptions, tongueOptions, yesNoOptions,
} from "../../config/options";
import { ToothPickerField } from "../fields/ToothPickerField";

/** Paso 3 (pág. 3, parte alta): análisis funcional. */
export function Step3Functional() {
  const { control, setValue, getValues } = useFormContext<RecordFormValues>();
  const [tongue, bruxism, habitsInAnamnesis] = useWatch({
    control,
    name: ["content.functional.tongueActivity", "content.functional.bruxism", "content.anamnesis.suckingHabits"],
  });
  const habitsFixed = habitsInAnamnesis === "NO";

  // "No" en la anamnesis fija los hábitos en "No" (el servidor aplica la misma regla al guardar).
  useEffect(() => {
    const current = getValues("content.functional.suckingHabitTypes") ?? [];
    if (habitsFixed && !(current.length === 1 && current[0] === "NONE")) {
      setValue("content.functional.suckingHabitTypes", ["NONE"], { shouldDirty: true });
    }
  }, [habitsFixed, getValues, setValue]);

  return (
    <div className="flex flex-col gap-8">
      <ChoiceField name="content.functional.breathing" label="Respiración" options={breathingOptions} />
      <ChoiceField name="content.functional.swallowing" label="Deglución" options={swallowingOptions} />
      <ChoiceField name="content.functional.lipClosure" label="Cierre labial" options={lipClosureOptions} />
      <div className="flex flex-col gap-3">
        <ChoiceField name="content.functional.tongueActivity" label="Actividad lingual" options={tongueOptions} />
        {tongue === "LATERAL_INTERPOSITION" ? (
          <MultiChoiceField name="content.functional.tongueLateralSides" label="Lado" options={sideOptions} className="ml-6" />
        ) : null}
      </div>
      <ChoiceMatrix<RecordFormValues>
        label="Musculatura"
        options={muscleOptions}
        rows={[
          { name: "content.functional.upperLip", label: "Labio superior" },
          { name: "content.functional.lowerLip", label: "Labio inferior" },
          { name: "content.functional.masseter", label: "Masetero" },
          { name: "content.functional.mentalis", label: "Mentoniano" },
        ]}
      />
      <MultiChoiceField
        name="content.functional.suckingHabitTypes"
        label="Hábitos de succión"
        options={suckingHabitOptions}
        exclusiveValue="NONE"
        disabled={habitsFixed}
        hint={habitsFixed ? "En la anamnesis se respondió \"No\" a hábitos de succión." : undefined}
      />
      <ChoiceField name="content.functional.lingualFrenulum" label="Frenillo lingual" options={frenulumOptions}
        hint={`${HEART_TEST_NOTE} Referencia a la prueba de frenillo lingual.`} />
      <ChoiceField name="content.functional.snoring" label="¿El paciente ronca durante el sueño?" options={yesNoOptions} />
      <div className="flex flex-col gap-3">
        <ChoiceField name="content.functional.bruxism" label="¿Paciente con síntomas de bruxismo?" options={bruxismOptions} vertical />
        {bruxism === "WITH_WEAR" ? <ToothPickerField name="content.functional.bruxismTeeth" label="Piezas con desgaste" /> : null}
      </div>
    </div>
  );
}
