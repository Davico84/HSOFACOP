import type { RecordResponse } from "@/modules/core/services/generated/model";
import { cn } from "@/modules/core/utils/cn";
import { CROWDING_ROWS, LOWER_INCISORS, MOYERS_SIDES } from "../../config/moyers";
import { formatAge, formatDate } from "../../utils/recordDisplay";
import { moyersResult } from "../../utils/moyers";
import { formatMm, formatSigned } from "../../utils/transversal";
import { PrintField } from "./PrintField";
import { PrintLines } from "./PrintLines";
import { PrintPage } from "./PrintPage";
import { LABEL } from "./printStyle";

interface PrintMoyersSectionProps {
  record: RecordResponse;
}

const CELL = "border border-foreground px-[4pt] py-[2pt]";
const NUM = cn(CELL, "text-center tabular-nums");
const mm = (value: number | null | undefined) => (value === null || value === undefined ? "" : formatMm(value));

/**
 * Pág. 6: "FICHA PARA EL ANÁLISIS DE MOYERS". La ficha y la "Tabla 2", que en el PDF son una
 * imagen, se reconstruyen como tablas; requerido (Moyers 75 %), diferencias y predisposición de
 * apiñamiento se calculan al imprimir.
 */
export function PrintMoyersSection({ record }: PrintMoyersSectionProps) {
  const m = record.content.models?.moyers;
  const { sum, sides, crowding } = moyersResult(m?.lowerIncisors, m?.availableSpace);
  const rows: [string, (side: (typeof sides)[number]) => string][] = [
    ["Espacio disponible", (s) => mm(s.available)],
    ["Espacio requerido (Moyers 75 %)", (s) => mm(s.required)],
    ["Diferencia", (s) => formatSigned(s.difference)],
  ];
  return (
    <PrintPage recordNumber={record.recordNumber} title="Ficha para el análisis de Moyers">
      <div className="mt-[4pt] flex flex-col">
        <PrintField label="Nombre" value={record.patientName} lined />
        <div className="flex gap-4">
          <PrintField label="Edad" value={formatAge(record.ageYears)} lined center />
          <PrintField label="Fecha" value={formatDate(m?.analysisDate)} grow={2} lined center />
        </div>
      </div>
      <table className="mt-[10pt] w-full border-collapse">
        <tbody>
          <tr>
            <th colSpan={5} className={cn(CELL, LABEL, "text-left font-normal")}>
              Ficha para la recolección de datos para el análisis predictivo de Moyers
            </th>
          </tr>
          <tr>
            <th scope="row" className={cn(CELL, LABEL, "w-[58mm] text-left font-normal")}>Diente · ancho mesiodistal</th>
            <td colSpan={2} className={cn(CELL, "py-[3pt]")}>
              {/* Como en el PDF: el número de la pieza arriba y su ancho debajo. */}
              <span className="grid grid-cols-4 text-center tabular-nums">
                {LOWER_INCISORS.map(({ key, label }) => (
                  <span key={key} className={LABEL}>{label}</span>
                ))}
                {LOWER_INCISORS.map(({ key, label }) => (
                  <span key={key} aria-label={`Pieza ${label}`}>{mm(m?.lowerIncisors?.[key])}</span>
                ))}
              </span>
            </td>
            <td colSpan={2} className={CELL}>
              <span className={LABEL}>Suma de anteriores en mm:</span> <span className="tabular-nums">{mm(sum)}</span>
            </td>
          </tr>
          <tr className={LABEL}>
            <td className={CELL} />
            <th colSpan={2} className={cn(CELL, "text-left font-normal")}>Mandíbula</th>
            <th colSpan={2} className={cn(CELL, "text-left font-normal")}>Maxilar</th>
          </tr>
          <tr className={LABEL}>
            <td className={CELL} />
            {MOYERS_SIDES.map(({ key, side }) => (
              <th key={key} className={cn(CELL, "w-[25mm] text-left font-normal")}>{side}</th>
            ))}
          </tr>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th scope="row" className={cn(CELL, LABEL, "text-left font-normal whitespace-nowrap")}>{label}</th>
              {sides.map((s) => (
                <td key={s.key} className={NUM}>{value(s)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-[12pt] text-[11pt] font-bold">Tabla 2. Tabla de los resultados obtenidos en la diferencia.</p>
      <table className="mt-[4pt] w-[80%] border-collapse">
        <tbody>
          <tr>
            <th colSpan={2} className={cn(CELL, LABEL, "text-left font-normal")}>Predisposición de Apiñamiento dental</th>
          </tr>
          {CROWDING_ROWS.map(({ key, label }) => (
            <tr key={key}>
              <th scope="row" className={cn(CELL, LABEL, "w-[30%] text-left font-normal")}>{label}</th>
              <td className={CELL}>{crowding[key].join(" · ")}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <PrintLines label="INTERPRETACIÓN" value={m?.interpretation} lines={3} />
    </PrintPage>
  );
}
