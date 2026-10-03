import { useFormContext, useWatch } from "react-hook-form";
import { SectionStatus } from "@/modules/core/components/SectionStatus";
import type { RecordFormValues } from "../../schemas/record";
import { countFilled, filledLabel } from "../../utils/filled";

interface FilledStatusProps {
  /** Análisis de modelos cuyo avance se muestra. */
  name: "content.models.transversal" | "content.models.moyers" | "content.models.nance" | "content.models.bolton";
}

/**
 * Cuántos datos tiene registrados un análisis. Vigila solo su análisis: así escribir en un campo
 * redibuja esta píldora y no todo el paso.
 */
export function FilledStatus({ name }: FilledStatusProps) {
  const { control } = useFormContext<RecordFormValues>();
  const count = countFilled(useWatch({ control, name }));
  return <SectionStatus active={count > 0}>{filledLabel(count)}</SectionStatus>;
}
