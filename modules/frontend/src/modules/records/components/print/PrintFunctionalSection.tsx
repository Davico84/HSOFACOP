import type { RecordResponse } from "@/modules/core/services/generated/model";
import {
  breathingOptions, bruxismOptions, frenulumOptions, HEART_TEST_NOTE, lipClosureOptions, muscleOptions,
  sideOptions, suckingHabitOptions, swallowingOptions, tongueOptions, yesNoOptions,
} from "../../config/options";
import { formatTeeth } from "../../utils/fdi";
import { PrintChoice } from "./PrintChoice";
import { PrintField } from "./PrintField";
import { PrintPage } from "./PrintPage";

interface PrintFunctionalSectionProps {
  record: RecordResponse;
}

const MUSCLES = [
  ["upperLip", "Labio superior:"],
  ["lowerLip", "Labio inferior:"],
  ["masseter", "Masetero:"],
  ["mentalis", "Mentoniano:"],
] as const;

/** Pág. 3 (parte alta): análisis funcional. */
export function PrintFunctionalSection({ record }: PrintFunctionalSectionProps) {
  const f = record.content.functional;
  const lateral = f.tongueActivity === "LATERAL_INTERPOSITION";
  return (
    <PrintPage recordNumber={record.recordNumber} title="Análisis funcional">
      <PrintChoice label="Respiración:" options={breathingOptions} value={f.breathing} />
      <PrintChoice label="Deglución:" options={swallowingOptions} value={f.swallowing} />
      <PrintChoice label="Cierre labial:" options={lipClosureOptions} value={f.lipClosure} />
      <PrintChoice label="Actividad lingual:" options={tongueOptions} value={f.tongueActivity} />
      {lateral ? <div className="pl-[8mm]"><PrintChoice label="Lado:" options={sideOptions} value={f.tongueLateralSides} /></div> : null}
      <table className="w-full">
        <tbody>
          {MUSCLES.map(([key, label]) => (
            <tr key={key}>
              <td className="pr-4">{label}</td>
              {muscleOptions.map((o) => (
                <td key={o.value} className="pr-4">
                  {f[key] === o.value ? "☒" : "☐"} {o.label}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <PrintChoice label="Hábitos de succión:" options={suckingHabitOptions} value={f.suckingHabitTypes} />
      <PrintChoice label="Frenillo lingual:" options={frenulumOptions} value={f.lingualFrenulum} suffix={HEART_TEST_NOTE} />
      <PrintChoice label="¿El paciente ronca durante el sueño?" options={yesNoOptions} value={f.snoring} />
      <p>¿Paciente con síntomas de bruxismo?</p>
      <div className="flex flex-col pl-[8mm]">
        {bruxismOptions.map((o) => (
          <p key={o.value} className="flex items-end gap-1">
            <span>{f.bruxism === o.value ? "☒" : "☐"} {o.label}</span>
            {o.value === "WITH_WEAR" ? <PrintField label="Piezas:" value={formatTeeth(f.bruxismTeeth)} className="ml-[3pt]" /> : null}
          </p>
        ))}
      </div>
    </PrintPage>
  );
}
