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
      className={cn(
        // En celular se apila: la fracción y, debajo, "= cociente × 100 = relación %".
        "flex gap-x-3 gap-y-2",
        print ? "flex-row items-center text-[10pt]" : "flex-col items-center text-sm sm:flex-row",
        className,
      )}
      role="group"
      aria-label={`Fórmula: suma mandibular ${count} sobre suma maxilar ${count}, por 100`}
    >
      {/* Etiqueta · recuadro · unidad en columnas: los dos recuadros quedan uno sobre otro, y la
          línea de fracción cruza todo el ancho. */}
      <div className="inline-grid grid-cols-[auto_auto_auto] items-center gap-x-2">
        <span className="px-1 pb-1">Suma mandibular {count}</span>
        <span className={cn(box, "mb-1")} aria-label={`Suma mandibular ${count}`}>{value(mandibular)}</span>
        <span className="pb-1 pr-1">mm</span>
        <span className="col-span-3 border-t border-foreground" aria-hidden="true" />
        <span className="px-1 pt-1">Suma maxilar {count}</span>
        <span className={cn(box, "mt-1")} aria-label={`Suma maxilar ${count}`}>{value(maxillary)}</span>
        <span className="pt-1 pr-1">mm</span>
      </div>
      <span className="flex items-center gap-x-3">
        <span>=</span>
        <span className={box}>{quotientText}</span>
        <span>× 100 =</span>
        <span className={cn(box, "font-semibold")} aria-label={`Relación ${count === 12 ? "total" : "anterior"} (%)`}>
          {ratio === null ? "" : `${formatMm(ratio)} %`}
        </span>
      </span>
    </div>
  );
}
