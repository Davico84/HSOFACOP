import type { RecordResponse } from "@/modules/core/services/generated/model";
import { isMinor } from "../../utils/age";
import { PrintField } from "./PrintField";
import { PrintSignatureRow } from "./PrintSignatureRow";
import { PrintLines } from "./PrintLines";
import { PrintPage } from "./PrintPage";
import { LABEL } from "./printStyle";

interface PrintSignaturesSectionProps {
  record: RecordResponse;
}

/** Pág. 13: plan de tratamiento final y firmas a mano (fecha en blanco; apoderado si es menor). */
export function PrintSignaturesSection({ record }: PrintSignaturesSectionProps) {
  const s = record.content.signatures;
  const minor = isMinor(record.ageYears ?? null);
  return (
    <PrintPage recordNumber={record.recordNumber} title="Plan de tratamiento final">
      <PrintLines value={record.content.diagnosis.finalTreatmentPlan} lines={8} />
      <div className="mt-[24pt] flex"><PrintField label="FECHA:" value="" className="max-w-72" lined /></div>
      {minor ? (
        <>
          <p className={`mt-[17pt] ${LABEL}`}>FIRMA DEL APODERADO:</p>
          <PrintSignatureRow name={s.guardianName} relationship={s.guardianRelationship ?? null} />
        </>
      ) : (
        <>
          <p className={`mt-[17pt] ${LABEL}`}>FIRMA DEL PACIENTE:</p>
          <PrintSignatureRow name={s.patientSignatureName ?? record.patientName} />
        </>
      )}
      <p className={`mt-[17pt] ${LABEL}`}>FIRMA SUPERVISOR:</p>
      <PrintSignatureRow name={s.supervisor1Name} />
      <div className="mt-[10pt]"><PrintSignatureRow name={s.supervisor2Name} /></div>
      <p className={`mt-[17pt] ${LABEL}`}>FIRMA DEL TRATANTE:</p>
      <PrintSignatureRow name={s.treatingSignatureName ?? record.treatingDentist} />
    </PrintPage>
  );
}
