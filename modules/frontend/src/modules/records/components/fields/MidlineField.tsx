import { useFormContext, useWatch } from "react-hook-form";
import { ChoiceField } from "@/modules/core/components/form/ChoiceField";
import { MeasureField } from "@/modules/core/components/form/MeasureField";
import type { RecordFormValues } from "../../schemas/record";
import { midlineOptions } from "../../config/options";

interface MidlineFieldProps {
  name: "content.occlusal.midlineUpper" | "content.occlusal.midlineLower";
  label: string;
}

/** Línea media de una arcada: centrada o desviada a un lado, con los milímetros (≥ 0,5) si está desviada. */
export function MidlineField({ name, label }: MidlineFieldProps) {
  const { control } = useFormContext<RecordFormValues>();
  const position = useWatch({ control, name: `${name}.position` });
  const deviated = position === "DEVIATED_RIGHT" || position === "DEVIATED_LEFT";
  return (
    <div className="flex flex-wrap items-end gap-4">
      <ChoiceField name={`${name}.position`} label={label} options={midlineOptions} />
      {deviated ? <MeasureField name={`${name}.deviationMm`} label="Desviación" unit="mm" step={0.5} /> : null}
    </div>
  );
}
