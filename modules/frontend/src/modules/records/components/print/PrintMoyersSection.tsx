import type { RecordResponse } from "@/modules/core/services/generated/model";
import { cn } from "@/modules/core/utils/cn";
import { CROWDING_ROWS, LOWER_INCISORS, MOYERS_SIDES } from "../../config/moyers";
import { formatAge, formatDate } from "../../utils/recordDisplay";
import { moyersResult } from "../../utils/moyers";
import { formatMm, formatSigned } from "../../utils/transversal";
import { PrintField } from "./PrintField";
import { PrintLines } from "./PrintLines";
import { PrintPage } from "./PrintPage";
import { TABLE_CELL, TABLE_HEAD, TABLE_NUM } from "./printStyle";

interface PrintMoyersSectionProps {
  record: RecordResponse;
}

const mm = (value: number | null | undefined) => (value === null || value === undefined ? "" : formatMm(value));

/**
 * Pág. 6: "FICHA PARA EL ANÁLISIS DE MOYERS". La ficha y la "Tabla 2", que en el PDF son una
 * imagen, se reconstruyen como tablas; requerido (Moyers 75 %) y diferencias se calculan al
 * imprimir; la predisposición de apiñamiento es la que escribió el odontólogo.
 */
export function PrintMoyersSection({ record }: PrintMoyersSectionProps) {
  const m = record.content.models?.moyers;
  const { sum, sides } = moyersResult(m?.lowerIncisors, m?.availableSpace);
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
            <th colSpan={5} className={cn(TABLE_HEAD, "text-left")}>
              Ficha para la recolección de datos para el análisis predictivo de Moyers
            </th>
          </tr>
          {/* Una columna por pieza, alineada con las de cada lado: la etiqueta arriba (sombreada) y el valor debajo. */}
          <tr>
            <th scope="row" className={cn(TABLE_HEAD, "w-[58mm] text-left")}>Diente</th>
            {LOWER_INCISORS.map(({ key, label }) => (
              <th key={key} scope="col" className={cn(TABLE_HEAD, "text-center")}>{label}</th>
            ))}
          </tr>
          <tr>
            <th scope="row" className={cn(TABLE_HEAD, "text-left")}>Ancho mesiodistal</th>
            {LOWER_INCISORS.map(({ key, label }) => (
              <td key={key} className={TABLE_NUM} aria-label={`Pieza ${label}`}>{mm(m?.lowerIncisors?.[key])}</td>
            ))}
          </tr>
          <tr>
            <th scope="row" className={cn(TABLE_HEAD, "text-left")}>Suma de anteriores en mm</th>
            <td colSpan={4} className={TABLE_NUM} aria-label="Suma de anteriores">{mm(sum)}</td>
          </tr>
          <tr>
            <td className={TABLE_HEAD} />
            <th colSpan={2} className={cn(TABLE_HEAD, "text-center")}>Mandíbula</th>
            <th colSpan={2} className={cn(TABLE_HEAD, "text-center")}>Maxilar</th>
          </tr>
          <tr>
            <td className={TABLE_HEAD} />
            {MOYERS_SIDES.map(({ key, side }) => (
              <th key={key} className={cn(TABLE_HEAD, "w-[25mm] text-center")}>{side}</th>
            ))}
          </tr>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th scope="row" className={cn(TABLE_HEAD, "text-left whitespace-nowrap")}>{label}</th>
              {sides.map((s) => (
                <td key={s.key} className={TABLE_NUM}>{value(s)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-[12pt] text-[11pt] font-bold">Tabla 2. Tabla de los resultados obtenidos en la diferencia.</p>
      <table className="mt-[4pt] w-[80%] border-collapse">
        <tbody>
          <tr>
            <th colSpan={2} className={cn(TABLE_HEAD, "text-left")}>Predisposición de Apiñamiento dental</th>
          </tr>
          {CROWDING_ROWS.map(({ key, label }) => (
            <tr key={key}>
              <th scope="row" className={cn(TABLE_HEAD, "w-[30%] text-left")}>{label}</th>
              <td className={TABLE_CELL}>{m?.[key]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <PrintLines label="INTERPRETACIÓN" value={m?.interpretation} lines={3} />
    </PrintPage>
  );
}
