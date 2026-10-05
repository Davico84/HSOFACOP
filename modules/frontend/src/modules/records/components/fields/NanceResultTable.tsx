import { useFormContext, useWatch } from "react-hook-form";
import { ComputedValue } from "@/modules/core/components/form/ComputedValue";
import { fieldError } from "@/modules/core/components/form/fieldError";
import { Input } from "@/modules/core/ui/input";
import { SHORT_TEXT, type RecordFormValues } from "../../schemas/record";
import { NANCE_ARCHES } from "../../config/nance";
import { archTotal, discrepancy } from "../../utils/nance";
import { formatMm, formatSigned } from "../../utils/transversal";

/** Columnas desde `sm`: arcada · SA · ST · discrepancia · conclusión. */
const COLUMNS = "sm:grid-cols-[5rem_7rem_7rem_7rem_minmax(12rem,1fr)]";
const HEAD = "text-xs font-medium text-muted-foreground";

/**
 * Resultado de Nance por arcada, como la tabla final del PDF: SA y ST (repetidos de los puntos 1 y
 * 2) y discrepancia SA − ST en cajas bloqueadas, y la conclusión (la escribe el odontólogo). Grilla
 * con roles de tabla: en celular cada arcada se apila como un bloque con sus valores rotulados.
 */
export function NanceResultTable() {
  const { control, register, formState } = useFormContext<RecordFormValues>();
  const nance = useWatch({ control, name: "content.models.nance" });
  const columns = ["SA · espacio disponible", "ST · espacio requerido", "Discrepancia", "Conclusión"];

  return (
    <fieldset className="flex min-w-0 flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium">Discrepancia óseo dentaria</legend>
      <div role="table" aria-label="Discrepancia óseo dentaria" className="rounded-md border border-border text-sm">
        <div role="rowgroup" className="hidden sm:block">
          <div role="row" className={`grid items-end gap-3 border-b border-border bg-muted px-3 py-2 ${COLUMNS}`}>
            <span role="columnheader" className={HEAD}>Arcada</span>
            {columns.map((c) => (
              <span key={c} role="columnheader" className={`${HEAD} sm:text-center`}>{c}</span>
            ))}
          </div>
        </div>
        <div role="rowgroup">
          {NANCE_ARCHES.map((arch) => {
            const total = archTotal(nance?.[arch.widths], arch.teeth);
            const available = nance?.[arch.available];
            const diff = discrepancy(available, total);
            const conclusionName = `content.models.nance.${arch.conclusion}` as const;
            const conclusionError = fieldError(formState.errors, conclusionName);
            const values = [
              { head: columns[0], label: `SA, espacio disponible ${arch.label.toLowerCase()}`, text: available == null ? "" : `${formatMm(available)} mm` },
              { head: columns[1], label: `ST, espacio requerido ${arch.label.toLowerCase()}`, text: total === null ? "" : `${formatMm(total)} mm` },
              { head: columns[2], label: `Discrepancia ${arch.label.toLowerCase()}`, text: diff === null ? "" : `${formatSigned(diff)} mm` },
            ];
            return (
              <div
                key={arch.key}
                role="row"
                className={`grid grid-cols-3 gap-2 border-b border-border p-3 last:border-b-0 sm:items-center sm:gap-3 ${COLUMNS}`}
              >
                <span role="rowheader" className="col-span-3 font-medium sm:col-span-1">{arch.label}</span>
                {values.map((v) => (
                  <div key={v.head} role="cell" className="flex flex-col gap-1">
                    <span className={`${HEAD} sm:hidden`} aria-hidden="true">{v.head}</span>
                    <ComputedValue label={v.label} className="w-full sm:mx-auto sm:w-24">{v.text}</ComputedValue>
                  </div>
                ))}
                <div role="cell" className="col-span-3 flex flex-col gap-1 sm:col-span-1">
                  <span className={`${HEAD} sm:hidden`} aria-hidden="true">{columns[3]}</span>
                  <Input
                    className="h-8"
                    maxLength={SHORT_TEXT}
                    aria-label={`Conclusión ${arch.label.toLowerCase()}`}
                    aria-invalid={conclusionError ? true : undefined}
                    {...register(conclusionName)}
                  />
                  {conclusionError ? <p className="text-xs text-destructive">{conclusionError}</p> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </fieldset>
  );
}
