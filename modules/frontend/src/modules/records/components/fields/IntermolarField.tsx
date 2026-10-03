import { useFormContext, useWatch } from "react-hook-form";
import { MeasureField } from "@/modules/core/components/form/MeasureField";
import type { RecordFormValues } from "../../schemas/record";
import type { Arch } from "../../config/transversal";
import { formatComparison, intermolarComparison } from "../../utils/transversal";

interface IntermolarFieldProps {
  arch: Arch;
  label: string;
}

/** Ancho molar (AMS o AMI) con su diferencia en vivo frente al promedio según el sexo del paciente. */
export function IntermolarField({ arch, label }: IntermolarFieldProps) {
  const name = arch === "upper" ? "content.models.transversal.intermolarUpper" : "content.models.transversal.intermolarLower";
  const { control } = useFormContext<RecordFormValues>();
  const [value, sex] = useWatch({ control, name: [name, "patientSex"] });
  const comparison = formatComparison(intermolarComparison(value, arch, sex));
  return (
    <div className="flex flex-col gap-1">
      <MeasureField name={name} label={label} unit="mm" />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {comparison || "Indica el sexo del paciente (paso 1) para comparar con el promedio."}
      </p>
    </div>
  );
}
