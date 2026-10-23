import type { RecordResponse } from "@/modules/core/services/generated/model";
import { formatAge } from "../../utils/recordDisplay";
import { effectiveSum, formatMm } from "../../utils/suggestedSum";
import { tanakaResult, tanakaSuggestedSum } from "../../utils/tanaka";
import { PrintField } from "./PrintField";
import { PrintLines } from "./PrintLines";
import { PrintPage } from "./PrintPage";

interface PrintTanakaSectionProps {
  record: RecordResponse;
}

/**
 * "FÓRMULA DE TANAKA-JOHNSTON" (guía de ortodoncia interceptiva), tras la hoja de Moyers: las dos
 * fórmulas con la suma usada (la escrita o la de los incisivos de Moyers, sin indicar cuál) y la
 * interpretación. Sin suma, la fórmula sale con "___" y el resultado "—".
 */
export function PrintTanakaSection({ record }: PrintTanakaSectionProps) {
  const models = record.content.models;
  const k = models?.tanaka;
  const sum = effectiveSum(k?.incisorSum, tanakaSuggestedSum(models?.moyers?.lowerIncisors));
  const result = tanakaResult(sum);
  const shown = sum === null ? "___" : formatMm(sum);
  const rows: [string, string, number | undefined][] = [
    ["MAX", "11", result?.maxilla],
    ["MAND", "10,5", result?.mandible],
  ];
  return (
    <PrintPage recordNumber={record.recordNumber} title="Fórmula de Tanaka-Johnston">
      <div className="mt-[4pt] flex flex-col">
        <PrintField label="Nombre" value={record.patientName} lined />
        <div className="flex">
          <PrintField label="Edad" value={formatAge(record.ageYears)} grow={0} lined center className="w-[50%]" />
        </div>
      </div>
      <div className="mt-[12pt] flex flex-col tabular-nums">
        {rows.map(([arch, constant, value]) => (
          <p key={arch} aria-label={`Tanaka-Johnston ${arch}`}>
            {arch} ({shown} / 2) + {constant} = <span className="font-bold">{value === undefined ? "—" : `${formatMm(value)} mm`}</span>
          </p>
        ))}
      </div>
      <p className="mt-[4pt] text-[9pt]">Suma de los incisivos inferiores 42, 41, 31 y 32.</p>
      <PrintLines label="INTERPRETACIÓN" value={k?.interpretation} lines={3} />
    </PrintPage>
  );
}
