import { useFormContext, useWatch } from "react-hook-form";
import { ComputedValue } from "@/modules/core/components/form/ComputedValue";
import { SectionStatus } from "@/modules/core/components/SectionStatus";
import { cn } from "@/modules/core/utils/cn";
import type { RecordFormValues } from "../../schemas/record";
import { boltonWidth, type BoltonRatioDef } from "../../config/bolton";
import { boltonResult } from "../../utils/bolton";
import { formatMm, formatSigned } from "../../utils/transversal";
import { BoltonFormula } from "../BoltonFormula";

interface BoltonRatioBlockProps {
  def: BoltonRatioDef;
}

/**
 * Una relación de Bolton (total o anterior): media y rango, la fórmula, si está dentro del rango y,
 * según quede sobre o bajo la media, real, ideal y diferencia de la arcada que sobra. La columna
 * que no aplica queda atenuada.
 */
export function BoltonRatioBlock({ def }: BoltonRatioBlockProps) {
  const { control } = useFormContext<RecordFormValues>();
  const models = useWatch({ control, name: "content.models" });
  const r = boltonResult(def, (t) => boltonWidth(models, t));
  const mean = formatMm(def.mean);
  const sides = [
    { key: "mandibular", title: `${def.label} > ${mean} %`, arch: "mandibular" },
    { key: "maxillary", title: `${def.label} < ${mean} %`, arch: "maxilar" },
  ] as const;

  return (
    <section aria-label={def.label} className="flex flex-col gap-3 rounded-md border border-border p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold uppercase tracking-wide">{def.label}</h4>
        <span className="text-xs text-muted-foreground">
          Media <b>{mean} %</b> · Rango <b>{formatMm(def.range[0])} – {formatMm(def.range[1])}</b>
        </span>
      </header>
      <div className="flex flex-wrap items-center gap-3">
        <BoltonFormula count={def.count} mandibular={r.mandibular} maxillary={r.maxillary} quotient={r.quotient} ratio={r.ratio} />
        {r.inRange === null ? null : (
          <SectionStatus active={r.inRange}>{r.inRange ? "Dentro del rango" : "Fuera del rango"}</SectionStatus>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {sides.map((side) => {
          const active = r.excess === side.key;
          return (
            <div key={side.key} className={cn("flex flex-col gap-2 border-l-2 pl-3", active ? "border-primary" : "border-border opacity-50")}>
              <span className="text-xs font-semibold">{side.title}</span>
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                {[
                  { label: `Real ${side.arch} ${def.count}`, text: active && r.actual !== null ? `${formatMm(r.actual)} mm` : "" },
                  { label: `Ideal ${side.arch} ${def.count}`, text: active && r.ideal !== null ? `${formatMm(r.ideal)} mm` : "" },
                  { label: "Diferencia", text: active && r.difference !== null ? `${formatSigned(r.difference)} mm` : "" },
                ].map(({ label, text }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <span aria-hidden="true">{label}</span>
                    <ComputedValue label={`${side.title}: ${label}`}>{text}</ComputedValue>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
