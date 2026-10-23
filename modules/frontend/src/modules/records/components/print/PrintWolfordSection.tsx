import type { RecordResponse } from "@/modules/core/services/generated/model";
import { cn } from "@/modules/core/utils/cn";
import { boltonWidth } from "../../config/bolton";
import { formatAge } from "../../utils/recordDisplay";
import { effectiveSum, formatMm, formatSigned } from "../../utils/suggestedSum";
import { WOLFORD_SUM_KEYS, WOLFORD_TEETH, wolfordResult, wolfordSuggestedSum, type WolfordSumKey } from "../../utils/wolford";
import { PrintField } from "./PrintField";
import { PrintLines } from "./PrintLines";
import { PrintPage } from "./PrintPage";
import { TABLE_HEAD, TABLE_NUM } from "./printStyle";

interface PrintWolfordSectionProps {
  record: RecordResponse;
}

const ARCHES = [
  { key: "upper", teeth: WOLFORD_TEETH.upper12Sum, label: "Maxilar" },
  { key: "lower", teeth: WOLFORD_TEETH.lower12Sum, label: "Mandíbula" },
] as const;

/**
 * "ANÁLISIS DE WOLFORD" (guía de ortodoncia interceptiva), tras la hoja de Bolton: la grilla de
 * anchos de las 12 piezas (solo lectura, de Bolton y Nance), las discrepancias total y parcial con
 * su fórmula y las sumas usadas (escritas o sugeridas, sin indicar cuál) y la interpretación. Sin
 * una suma, la fórmula sale con "___" y el resultado "—", sin signo.
 */
export function PrintWolfordSection({ record }: PrintWolfordSectionProps) {
  const models = record.content.models;
  const w = models?.wolford;
  const sums = Object.fromEntries(
    WOLFORD_SUM_KEYS.map((key) => [key, effectiveSum(w?.[key], wolfordSuggestedSum(models, key))]),
  ) as Record<WolfordSumKey, number | null>;
  const result = wolfordResult(sums);
  const show = (key: WolfordSumKey) => (sums[key] === null ? "___" : formatMm(sums[key]));
  const width = (tooth: number) => {
    const value = boltonWidth(models, tooth);
    return typeof value === "number" && Number.isFinite(value) ? formatMm(value) : "";
  };
  const rows = [
    { label: "Discrepancia total", formula: `Suma 12 Max ${show("upper12Sum")} − (Suma 12 Mand ${show("lower12Sum")} × 1,1)`, value: result.total },
    { label: "Discrepancia parcial", formula: `Suma 6 Max ${show("upper6Sum")} − (Suma 6 Mand ${show("lower6Sum")} × 1,3)`, value: result.partial },
  ];
  return (
    <PrintPage recordNumber={record.recordNumber} title="Análisis de Wolford">
      <div className="mt-[4pt] flex flex-col">
        <PrintField label="Nombre" value={record.patientName} lined />
        <div className="flex">
          <PrintField label="Edad" value={formatAge(record.ageYears)} grow={0} lined center className="w-[50%]" />
        </div>
      </div>
      <p className="mt-[10pt] text-[11pt] font-bold">Ancho mesiodistal de las 12 piezas</p>
      <table className="mt-[4pt] w-full border-collapse">
        <tbody>
          {/* Por arcada, los números de pieza arriba (sombreados) y los anchos debajo; casilla vacía si falta. */}
          {ARCHES.flatMap(({ key, teeth, label }) => [
            <tr key={`${key}-teeth`}>
              <th scope="row" rowSpan={2} className={cn(TABLE_HEAD, "w-[22mm] text-left")}>{label}</th>
              {teeth.map((tooth) => (
                <th key={tooth} scope="col" className={cn(TABLE_HEAD, "text-center")}>{tooth}</th>
              ))}
            </tr>,
            <tr key={`${key}-widths`}>
              {teeth.map((tooth) => (
                <td key={tooth} className={TABLE_NUM} aria-label={`Wolford, pieza ${tooth}`}>{width(tooth)}</td>
              ))}
            </tr>,
          ])}
        </tbody>
      </table>
      <div className="mt-[12pt] flex flex-col tabular-nums">
        {rows.map(({ label, formula, value }) => (
          <div key={label} aria-label={label} className="mb-[4pt]">
            <p>{label} = {formula}</p>
            <p>
              {label}: <span className="font-bold">{value === null ? "—" : `${formatSigned(value)} mm`}</span>
            </p>
          </div>
        ))}
      </div>
      <PrintLines label="INTERPRETACIÓN" value={w?.interpretation} lines={3} />
    </PrintPage>
  );
}
