import type { RecordResponse } from "@/modules/core/services/generated/model";
import { isMinor } from "../../utils/age";
import { PrintField } from "./PrintField";
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
      <div className="mt-[24pt] flex"><PrintField label="FECHA:" value="" className="max-w-72" handwritten /></div>
      {minor ? (
        <>
          <p className={`mt-[17pt] ${LABEL}`}>FIRMA DEL APODERADO:</p>
          <div className="flex gap-4">
            <PrintField label="Nombre" value={s.guardianName} grow={2} />
            <PrintField label="Parentesco" value={s.guardianRelationship} />
            <PrintField label="Firma" value="" handwritten />
          </div>
        </>
      ) : (
        <>
          <p className={`mt-[17pt] ${LABEL}`}>FIRMA DEL PACIENTE:</p>
          <div className="flex gap-4">
            <PrintField label="Nombre" value={s.patientSignatureName ?? record.patientName} grow={3} />
            <PrintField label="Firma" value="" handwritten />
          </div>
        </>
      )}
      <p className={`mt-[17pt] ${LABEL}`}>FIRMA SUPERVISOR:</p>
      <div className="flex gap-4">
        <PrintField label="Nombre" value={s.supervisor1Name} grow={3} />
        <PrintField label="Firma" value="" handwritten />
      </div>
      <div className="mt-[10pt] flex gap-4">
        <PrintField label="Nombre" value={s.supervisor2Name} grow={3} />
        <PrintField label="Firma" value="" handwritten />
      </div>
      <p className={`mt-[17pt] ${LABEL}`}>FIRMA DEL TRATANTE:</p>
      <div className="flex gap-4">
        <PrintField label="Nombre" value={s.treatingSignatureName ?? record.treatingDentist} grow={3} />
        <PrintField label="Firma" value="" handwritten />
      </div>
    </PrintPage>
  );
}
