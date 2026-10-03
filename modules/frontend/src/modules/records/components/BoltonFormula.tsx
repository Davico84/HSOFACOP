import { cn } from "@/modules/core/utils/cn";
import { formatMm } from "../utils/transversal";

interface BoltonFormulaProps {
  /** Piezas por arcada (12 o 6). */
  count: number;
  mandibular: number | null;
  maxillary: number | null;
  quotient: number | null;
  ratio: number | null;
  /** Hoja impresa: tamaños en pt y sin colores del tema. */
  print?: boolean;
  className?: string;
}

const value = (v: number | null) => (v === null ? "" : formatMm(v));

/**
 * Fórmula de la relación de Bolton dibujada como en el PDF: la suma mandibular sobre la línea de
 * fracción, la maxilar debajo, y a la derecha "= cociente × 100 = relación %".
 */
export function BoltonFormula({ count, mandibular, maxillary, quotient, ratio, print = false, className }: BoltonFormulaProps) {
  const box = cn(
    "inline-flex min-w-14 justify-center rounded-sm border px-1.5 tabular-nums",
    print ? "min-w-[14mm] border-foreground" : "border-input bg-muted text-muted-foreground",
  );
  const quotientText = quotient === null ? "" : quotient.toFixed(4).replace(".", ",");
  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-1", print ? "text-[10pt]" : "text-sm", className)}
      role="group"
      aria-label={`Fórmula: suma mandibular ${count} sobre suma maxilar ${count}, por 100`}
    >
      <div className="inline-flex flex-col">
        <span className="flex items-center gap-2 px-1 pb-1">
          Suma mandibular {count} <span className={box} aria-label={`Suma mandibular ${count}`}>{value(mandibular)}</span> mm
        </span>
        <span className="flex items-center gap-2 border-t border-foreground px-1 pt-1">
          Suma maxilar {count} <span className={box} aria-label={`Suma maxilar ${count}`}>{value(maxillary)}</span> mm
        </span>
      </div>
      <span>=</span>
      <span className={box}>{quotientText}</span>
      <span>× 100 =</span>
      <span className={cn(box, "font-semibold")} aria-label={`Relación ${count === 12 ? "total" : "anterior"} (%)`}>
        {ratio === null ? "" : `${formatMm(ratio)} %`}
      </span>
    </div>
  );
}
