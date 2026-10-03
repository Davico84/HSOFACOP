import type { RecordResponse } from "@/modules/core/services/generated/model";
import { PrintLines } from "./PrintLines";
import { PrintNumberedList } from "./PrintNumberedList";
import { PrintPage } from "./PrintPage";
import { PrintTitle } from "./PrintTitle";

interface PrintDiagnosisSectionProps {
  record: RecordResponse;
}

/** Págs. 11–12: diagnóstico general, problemas, metas, los dos planes, secuencia y próximas etapas. */
export function PrintDiagnosisSection({ record }: PrintDiagnosisSectionProps) {
  const d = record.content.diagnosis;
  return (
    <>
      <PrintPage recordNumber={record.recordNumber} title="Diagnóstico general">
        <PrintLines value={d.generalDiagnosis} lines={12} />
        <PrintNumberedList label="Lista de problemas" items={d.problemList} lines={8} />
        <PrintNumberedList label="Metas de tratamiento" items={d.treatmentGoals} lines={8} />
      </PrintPage>
      <PrintPage recordNumber={record.recordNumber} title="Planes de tratamiento">
        <PrintLines label="Plan 1" value={d.treatmentPlan1} lines={8} />
        <PrintLines label="Plan 2" value={d.treatmentPlan2} lines={8} />
        <PrintTitle>SECUENCIA DE TRATAMIENTO</PrintTitle>
        <PrintLines value={d.treatmentSequence} lines={8} />
        <PrintTitle>POSIBLES PRÓXIMAS ETAPAS</PrintTitle>
        <PrintLines value={d.nextStages} lines={3} />
      </PrintPage>
    </>
  );
}
