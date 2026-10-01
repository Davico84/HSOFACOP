import type { RecordResponse } from "@/modules/core/services/generated/model";
import { cooperationOptions, yesNoOptions } from "../../config/options";
import { formatAge, formatDate, formatDocument } from "../../utils/recordDisplay";
import { PrintChoice } from "./PrintChoice";
import { PrintField } from "./PrintField";
import { PrintLines } from "./PrintLines";
import { PrintPage } from "./PrintPage";

interface PrintPatientSectionProps {
  record: RecordResponse;
}

/** Pág. 1: odontólogo tratante, datos del paciente y anamnesis. */
export function PrintPatientSection({ record }: PrintPatientSectionProps) {
  const a = record.content.anamnesis;
  const birth = [record.birthPlace, formatDate(record.birthDate)].filter(Boolean).join(", ");
  const document = formatDocument(record.documentType, record.documentNumber);
  return (
    <PrintPage recordNumber={record.recordNumber} first>
      <div className="flex"><PrintField label="ODONTÓLOGO TRATANTE:" value={record.treatingDentist} /></div>
      <h2 className="mt-3 text-sm font-bold">ANAMNESIS</h2>
      <div className="flex gap-4">
        <PrintField label="PACIENTE" value={record.patientName} grow={3} />
        <PrintField label="Edad:" value={formatAge(record.ageYears)} />
      </div>
      <div className="flex"><PrintField label="Domicilio" value={record.address} /></div>
      <div className="flex gap-4">
        <PrintField label="Fecha de inicio de tratamiento:" value={formatDate(record.treatmentStartDate)} grow={2} />
        <PrintField label="Documento" value={document} />
      </div>
      <div className="flex gap-4">
        <PrintField label="Lugar y fecha de nacimiento del paciente" value={birth} grow={2} />
        <PrintField label="Celular" value={record.phone} />
      </div>
      <PrintLines label="Queja principal - ¿Por qué buscó tratamiento?" value={a.chiefComplaint} lines={2} />
      <PrintLines label="Gustos personales (color, canal preferido en YouTube, juguetes)." value={a.personalPreferences} lines={1} />
      <PrintChoice label="Índice de colaboración/cooperación:" options={cooperationOptions} value={a.cooperation} />
      <div className="flex flex-wrap gap-x-8">
        <PrintChoice label="Higiene oral:" options={yesNoOptions} value={a.oralHygiene} />
        <PrintChoice label="Hábitos de succión:" options={yesNoOptions} value={a.suckingHabits} />
      </div>
      {record.patientSex === "FEMALE" ? (
        <PrintChoice label="¿La 1ª menstruación ya ocurrió?" options={yesNoOptions} value={a.menarche} />
      ) : null}
      <PrintLines label="Historia médica/medicación de uso continuo." value={a.medicalHistory} lines={2} />
      <PrintLines label="Histórico de accidentes o traumas." value={a.accidentsHistory} lines={2} />
      <PrintLines label="Estructura familiar" value={a.familyStructure} lines={2} />
      <PrintLines label="Necesidad de tratamiento general (caries, endodoncia, exodoncia)." value={a.generalTreatmentNeeds} lines={2} />
      <PrintLines label="Características importantes de la herencia." value={a.heredity} lines={2} />
    </PrintPage>
  );
}
