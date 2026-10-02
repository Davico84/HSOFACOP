import type { RecordResponse } from "@/modules/core/services/generated/model";
import { cn } from "@/modules/core/utils/cn";
import { labelOf, sexOptions } from "../../config/options";
import { INTERMOLAR_NOTE, WALA_EV_NORMS } from "../../config/transversal";
import { formatAge } from "../../utils/recordDisplay";
import { difference, formatComparison, formatMm, formatSigned, intermolarComparison } from "../../utils/transversal";
import { PrintField } from "./PrintField";
import { PrintLines } from "./PrintLines";
import { PrintPage } from "./PrintPage";
import { LABEL } from "./printStyle";

interface PrintModelsSectionProps {
  record: RecordResponse;
}

const mm = (value: number | null | undefined) => (value === null || value === undefined ? "" : `${formatMm(value)} mm`);

/**
 * Pág. 5: "ANÁLISIS DE MODELOS · Análisis Transversal de los Modelos". El encabezado, que en el
 * PDF es una imagen, se reconstruye como texto; las diferencias con el promedio (por sexo) y con
 * las normas WALA–EV se calculan al imprimir.
 */
export function PrintModelsSection({ record }: PrintModelsSectionProps) {
  const t = record.content.models?.transversal;
  const sex = record.patientSex ?? null;
  const widths: [string, number | null | undefined, string][] = [
    ["AIS: Ancho inter canino superior", t?.intercanineUpper, ""],
    ["AII: Ancho inter canino inferior", t?.intercanineLower, ""],
    ["AMS: Ancho molar superior", t?.intermolarUpper, formatComparison(intermolarComparison(t?.intermolarUpper, "upper", sex))],
    ["AMI: Ancho molar inferior", t?.intermolarLower, formatComparison(intermolarComparison(t?.intermolarLower, "lower", sex))],
  ];
  return (
    <PrintPage recordNumber={record.recordNumber} title="Análisis de modelos">
      <p className="mt-[4pt] text-center text-[12pt] font-bold">Análisis Transversal de los Modelos</p>
      <div className="mt-[4pt] flex gap-4">
        <PrintField label="Paciente" value={record.patientName} grow={3} lined />
        <PrintField label="Edad" value={formatAge(record.ageYears)} lined center />
        <PrintField label="Sexo" value={labelOf(sexOptions, sex)} lined center />
      </div>
      <table className="mt-[7pt] w-full">
        <tbody>
          {widths.map(([label, value, comparison]) => (
            <tr key={label}>
              <td className={cn("w-[62mm] pr-3", LABEL)}>{label}:</td>
              <td className="w-[22mm] tabular-nums">{mm(value)}</td>
              <td>{comparison ? `(${comparison})` : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-[2pt] pl-[8mm] text-[9pt] leading-[13pt]">
        {INTERMOLAR_NOTE.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <div className="mt-[7pt] flex flex-wrap gap-x-[6mm]">
        <PrintField label="Ancho borde WALA" value={mm(t?.walaWidth)} grow={0} />
        <PrintField label="Ancho X Pc" value={mm(t?.xPcWidth)} grow={0} />
        <PrintField label="Ancho X´ Pc" value={mm(t?.xPrimePcWidth)} grow={0} />
        <PrintField label="Ancho X ideal" value={mm(t?.xIdealWidth)} grow={0} />
      </div>
      <table className="mt-[7pt] w-full">
        <thead>
          <tr className={LABEL}>
            <th className="pr-3 text-left font-normal">Distancia WALA a EV</th>
            <th className="w-[22mm] text-right font-normal">Norma</th>
            <th className="w-[26mm] text-right font-normal">Medido</th>
            <th className="w-[26mm] text-right font-normal">Diferencia</th>
          </tr>
        </thead>
        <tbody>
          {WALA_EV_NORMS.map(({ key, label, norm }) => {
            const value = t?.walaToEv?.[key];
            return (
              <tr key={key}>
                <td className="pr-3">{label}</td>
                <td className="text-right tabular-nums">{mm(norm)}</td>
                <td className="text-right tabular-nums">{mm(value)}</td>
                <td className="text-right tabular-nums">{formatSigned(difference(value, norm))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <PrintLines label="INTERPRETACIÓN" value={t?.interpretation} lines={3} />
    </PrintPage>
  );
}
