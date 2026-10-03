import { useFormContext, useWatch } from "react-hook-form";
import { MeasureField } from "@/modules/core/components/form/MeasureField";
import type { RecordFormValues } from "../../schemas/record";
import { LOWER_INCISORS, MOYERS_OUT_OF_RANGE } from "../../config/moyers";
import { incisorSum, requiredSpace } from "../../utils/moyers";
import { formatMm } from "../../utils/transversal";

/** Ancho mesiodistal de 42, 41, 31 y 32 con la suma de anteriores en vivo. */
export function MoyersIncisorsField() {
  const { control } = useFormContext<RecordFormValues>();
  const incisors = useWatch({ control, name: "content.models.moyers.lowerIncisors" });
  const sum = incisorSum(incisors);
  const outOfRange = sum !== null && requiredSpace(sum) === null;

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-medium">Ancho mesiodistal de los incisivos inferiores</legend>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {LOWER_INCISORS.map(({ key, label }) => (
          <MeasureField key={key} name={`content.models.moyers.lowerIncisors.${key}`} label={`Pieza ${label}`} unit="mm" />
        ))}
      </div>
      <p className="text-sm" aria-live="polite">
        Suma de anteriores: <span className="font-semibold tabular-nums">{sum === null ? "—" : `${formatMm(sum)} mm`}</span>
        {outOfRange ? <span className="ml-2 text-destructive">{MOYERS_OUT_OF_RANGE}</span> : null}
      </p>
    </fieldset>
  );
}
