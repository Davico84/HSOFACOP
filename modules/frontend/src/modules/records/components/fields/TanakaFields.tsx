import { useFormContext, useWatch } from "react-hook-form";
import { SuggestedMeasureField } from "@/modules/core/components/form/SuggestedMeasureField";
import { MAX_MODEL_MM, type RecordFormValues } from "../../schemas/record";
import { effectiveSum, formatMm } from "../../utils/suggestedSum";
import { tanakaResult, tanakaSuggestedSum } from "../../utils/tanaka";

const NOTES = {
  missing: "Completa los incisivos en Moyers o escribe la suma.",
  outOfRange: "Corrige los anchos fuera de rango en Moyers o escribe la suma.",
} as const;

/**
 * Suma de los incisivos inferiores (sugerida de Moyers, editable) y espacio previsto por
 * Tanaka-Johnston. Vigila solo Moyers y Tanaka para no redibujar el paso entero.
 */
export function TanakaFields() {
  const { control } = useFormContext<RecordFormValues>();
  const incisors = useWatch({ control, name: "content.models.moyers.lowerIncisors" });
  const written = useWatch({ control, name: "content.models.tanaka.incisorSum" });
  const suggested = tanakaSuggestedSum(incisors);
  const sum = effectiveSum(written, suggested);
  const result = tanakaResult(sum);
  return (
    <div className="flex flex-col gap-4">
      <SuggestedMeasureField<RecordFormValues>
        name="content.models.tanaka.incisorSum"
        label="Suma de los incisivos inferiores (42, 41, 31, 32)"
        unit="mm"
        min={0}
        max={MAX_MODEL_MM}
        suggestedValue={suggested.value}
        suggestedNote="Tomada de los incisivos de Moyers."
        missingNote={suggested.reason === "outOfRange" ? NOTES.outOfRange : NOTES.missing}
        sourceLabel="Moyers"
        formatValue={formatMm}
      />
      <div className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm" aria-live="polite">
        <p className="mb-1 font-medium">Espacio previsto para canino y premolares</p>
        <p>
          MAX ({sum === null ? "___" : formatMm(sum)} / 2) + 11 ={" "}
          <span className="font-semibold tabular-nums">{result ? `${formatMm(result.maxilla)} mm` : "—"}</span>
        </p>
        <p>
          MAND ({sum === null ? "___" : formatMm(sum)} / 2) + 10,5 ={" "}
          <span className="font-semibold tabular-nums">{result ? `${formatMm(result.mandible)} mm` : "—"}</span>
        </p>
      </div>
    </div>
  );
}
