import type { RecordResponse } from "@/modules/core/services/generated/model";
import { cn } from "@/modules/core/utils/cn";
import { NANCE_ARCHES, widthOf } from "../../config/nance";
import { formatAge, formatDate } from "../../utils/recordDisplay";
import { archTotal, discrepancy } from "../../utils/nance";
import { formatMm, formatSigned } from "../../utils/transversal";
import { ArchDiagram } from "../ArchDiagram";
import { PrintField } from "./PrintField";
import { PrintLines } from "./PrintLines";
import { PrintPage } from "./PrintPage";
import { TABLE_CELL, TABLE_HEAD, TABLE_NUM } from "./printStyle";

interface PrintNanceSectionProps {
  record: RecordResponse;
}

const mm = (value: number | null | undefined) => (value === null || value === undefined ? "" : `${formatMm(value)} mm`);

/**
 * Pág. 7: "ANÁLISIS DE NANCE · DISCREPANCIA ÓSEO DENTARIA". La ficha y el dibujo de la arcada, que
 * en el PDF son una imagen, se reconstruyen (tablas y SVG en grises); ST y discrepancia se calculan
 * al imprimir. La pág. 8 del PDF está en blanco y no se imprime.
 */
export function PrintNanceSection({ record }: PrintNanceSectionProps) {
  const n = record.content.models?.nance;
  const arches = NANCE_ARCHES.map((arch) => {
    const widths = n?.[arch.widths];
    const total = archTotal(widths, arch.teeth);
    return { ...arch, widths, total, available: n?.[arch.available], diff: discrepancy(n?.[arch.available], total), conclusion: n?.[arch.conclusion] };
  });
  const [upper, lower] = arches;
  const rows = [
    { label: "1. SA. Espacio disponible o longitud de arco.", up: upper.available, low: lower.available },
    { label: "2. ST. Espacio requerido, ancho m-d de los mesiales al 1° molar.", up: upper.total, low: lower.total },
  ];

  return (
    <PrintPage recordNumber={record.recordNumber} title="Análisis de Nance · discrepancia óseo dentaria">
      <div className="mt-[4pt] flex flex-col">
        <PrintField label="Nombre" value={record.patientName} lined />
        <div className="flex gap-4">
          <PrintField label="Edad" value={formatAge(record.ageYears)} lined center />
          <PrintField label="Fecha" value={formatDate(n?.analysisDate)} grow={2} lined center />
        </div>
      </div>
      <p className="mt-[10pt] text-[11pt] font-bold">Análisis de Nance &amp; Carey</p>
      <table className="mt-[4pt] w-full border-collapse">
        <tbody>
          {rows.map(({ label, up, low }) => (
            <tr key={label}>
              <th scope="row" className={cn(TABLE_HEAD, "text-left")}>{label}</th>
              <th scope="col" className={cn(TABLE_HEAD, "w-[18mm]")}>Superior</th>
              <td className={cn(TABLE_NUM, "w-[20mm]")}>{mm(up)}</td>
              <th scope="col" className={cn(TABLE_HEAD, "w-[18mm]")}>Inferior</th>
              <td className={cn(TABLE_NUM, "w-[20mm]")}>{mm(low)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-[6pt] flex items-center gap-[4mm]">
        <ArchDiagram print className="w-[40mm] shrink-0" />
        <table className="flex-1 border-collapse">
          <tbody>
            {arches.map((arch) => [
              <tr key={`${arch.key}-teeth`}>
                <th scope="row" className={TABLE_HEAD}>O.D.</th>
                {arch.teeth.map((t) => (
                  <th key={t} scope="col" className={cn(TABLE_HEAD, "px-[2pt] text-center")}>{t}</th>
                ))}
                <th scope="col" className={cn(TABLE_HEAD, "text-center")}>Total</th>
              </tr>,
              <tr key={`${arch.key}-widths`}>
                <td className={TABLE_CELL} />
                {arch.teeth.map((t) => (
                  <td key={t} className={cn(TABLE_NUM, "px-[2pt]")} aria-label={`Pieza ${t}`}>
                    {formatMm(widthOf(arch.widths, t))}
                  </td>
                ))}
                <td className={cn(TABLE_NUM, "whitespace-nowrap")} aria-label={`Total ${arch.label.toLowerCase()}`}>
                  {mm(arch.total)}
                </td>
              </tr>,
            ])}
          </tbody>
        </table>
      </div>
      <table className="mt-[10pt] w-full border-collapse">
        <thead>
          <tr>
            <td className={TABLE_HEAD} />
            <th scope="col" className={TABLE_HEAD}>SA Espacio Disponible</th>
            <th scope="col" className={TABLE_HEAD}>ST Espacio Requerido</th>
            <th scope="col" className={TABLE_HEAD}>Discrepancia</th>
            <th scope="col" className={cn(TABLE_HEAD, "w-[55mm]")}>Conclusión</th>
          </tr>
        </thead>
        <tbody>
          {arches.map((arch) => (
            <tr key={arch.key}>
              <th scope="row" className={cn(TABLE_HEAD, "text-left")}>{arch.label}</th>
              <td className={TABLE_NUM}>{mm(arch.available)}</td>
              <td className={TABLE_NUM}>{mm(arch.total)}</td>
              <td className={TABLE_NUM}>{arch.diff === null ? "" : `${formatSigned(arch.diff)} mm`}</td>
              <td className={cn(TABLE_CELL, "text-left")}>{arch.conclusion}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <PrintLines label="INTERPRETACIÓN" value={n?.interpretation} lines={3} />
    </PrintPage>
  );
}
