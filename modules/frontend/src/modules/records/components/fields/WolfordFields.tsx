import { useFormContext, useWatch } from "react-hook-form";
import { SuggestedMeasureField } from "@/modules/core/components/form/SuggestedMeasureField";
import { MAX_ARCH_SUM_MM, MAX_MODEL_MM, type RecordFormValues } from "../../schemas/record";
import { effectiveSum, formatMm, formatSigned } from "../../utils/suggestedSum";
import { WOLFORD_SUM_KEYS, wolfordResult, wolfordSuggestedSum, type WolfordSumKey } from "../../utils/wolford";

const LABELS: Record<WolfordSumKey, string> = {
  upper12Sum: "Suma 12 maxilares (16 → 26)",
  lower12Sum: "Suma 12 mandibulares (46 → 36)",
  upper6Sum: "Suma 6 maxilares (13 → 23)",
  lower6Sum: "Suma 6 mandibulares (43 → 33)",
};

const NOTES = {
  suggested: "Tomada de Bolton (incisivos y 1eros molares) y Nance (caninos y premolares).",
  missing: "Completa los anchos en Bolton y Nance o escribe la suma.",
  outOfRange: "Corrige los anchos fuera de rango o escribe la suma.",
} as const;

/**
 * Sumas de Wolford (sugeridas de Bolton y Nance, editables) y las discrepancias total y parcial.
 * Vigila solo los análisis de modelos que usa.
 */
export function WolfordFields() {
  const { control } = useFormContext<RecordFormValues>();
  const [nance, bolton, wolford] = useWatch({
    control,
    name: ["content.models.nance", "content.models.bolton", "content.models.wolford"],
  });
  const suggestions = Object.fromEntries(
    WOLFORD_SUM_KEYS.map((key) => [key, wolfordSuggestedSum({ nance, bolton }, key)]),
  ) as Record<WolfordSumKey, ReturnType<typeof wolfordSuggestedSum>>;
  const sums = Object.fromEntries(
    WOLFORD_SUM_KEYS.map((key) => [key, effectiveSum(wolford?.[key], suggestions[key])]),
  ) as Record<WolfordSumKey, number | null>;
  const result = wolfordResult(sums);
  const show = (v: number | null) => (v === null ? "___" : formatMm(v));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {WOLFORD_SUM_KEYS.map((key) => (
          <SuggestedMeasureField<RecordFormValues>
            key={key}
            name={`content.models.wolford.${key}`}
            label={LABELS[key]}
            unit="mm"
            min={0}
            max={key.endsWith("12Sum") ? MAX_ARCH_SUM_MM : MAX_MODEL_MM}
            suggestedValue={suggestions[key].value}
            suggestedNote={NOTES.suggested}
            missingNote={suggestions[key].reason === "outOfRange" ? NOTES.outOfRange : NOTES.missing}
            sourceLabel="Bolton y Nance"
            formatValue={formatMm}
          />
        ))}
      </div>
      <div className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm" aria-live="polite">
        <p className="mb-1 font-medium">Discrepancias</p>
        <p>
          Total = {show(sums.upper12Sum)} − ({show(sums.lower12Sum)} × 1,1) ={" "}
          <span className="font-semibold tabular-nums">{result.total === null ? "—" : `${formatSigned(result.total)} mm`}</span>
        </p>
        <p>
          Parcial = {show(sums.upper6Sum)} − ({show(sums.lower6Sum)} × 1,3) ={" "}
          <span className="font-semibold tabular-nums">{result.partial === null ? "—" : `${formatSigned(result.partial)} mm`}</span>
        </p>
      </div>
    </div>
  );
}
