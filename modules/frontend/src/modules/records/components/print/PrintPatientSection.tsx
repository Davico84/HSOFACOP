import type { RecordResponse } from "@/modules/core/services/generated/model";
import { cooperationOptions, NOT_REPORTED, yesNoOptions } from "../../config/options";
import { formatAge, formatDate, formatDocument } from "../../utils/recordDisplay";
import { PrintChoice } from "./PrintChoice";
import { PrintField } from "./PrintField";
import { PrintLines } from "./PrintLines";
import { PrintPage } from "./PrintPage";
import { PrintTitle } from "./PrintTitle";

interface PrintPatientSectionProps {
  record: RecordResponse;
}

/** Pág. 1: odontólogo tratante, datos del paciente y anamnesis (texto vacío → "No refiere"). */
export function PrintPatientSection({ record }: PrintPatientSectionProps) {
  const a = record.content.anamnesis;
  const birth = [record.birthPlace, formatDate(record.birthDate)].filter(Boolean).join(", ");
  const document = formatDocument(record.documentType, record.documentNumber);
  return (
    <PrintPage recordNumber={record.recordNumber} first>
      <div className="flex"><PrintField label="ODONTÓLOGO TRATANTE:" value={record.treatingDentist} /></div>
      <PrintTitle>ANAMNESIS</PrintTitle>
      <div className="flex gap-4">
        <PrintField label="PACIENTE" value={record.patientName} grow={3} lined />
        <PrintField label="Edad:" value={formatAge(record.ageYears)} lined center />
      </div>
      <div className="flex"><PrintField label="Domicilio" value={record.address} lined /></div>
      <div className="flex gap-4">
        <PrintField label="Fecha de inicio de tratamiento:" value={formatDate(record.treatmentStartDate)} grow={2} lined center />
        <PrintField label="Documento" value={document} lined center />
      </div>
      <div className="flex gap-4">
        <PrintField label="Lugar y fecha de nacimiento del paciente" value={birth} grow={2} lined center />
        <PrintField label="Celular" value={record.phone} lined center />
      </div>
      <PrintLines label="Queja principal - ¿Por qué buscó tratamiento?" value={a.chiefComplaint} emptyText={NOT_REPORTED} lines={2} />
      <PrintLines label="Gustos personales (color, canal preferido en YouTube, juguetes)." value={a.personalPreferences} emptyText={NOT_REPORTED} lines={1} />
      <PrintChoice label="Índice de colaboración/cooperación:" options={cooperationOptions} value={a.cooperation} />
      <div className="flex flex-wrap gap-x-8">
        <PrintChoice label="Higiene oral:" options={yesNoOptions} value={a.oralHygiene} />
        <PrintChoice label="Hábitos de succión:" options={yesNoOptions} value={a.suckingHabits} />
      </div>
      {record.patientSex === "FEMALE" ? (
        <PrintChoice label="¿La 1ª menstruación ya ocurrió?" options={yesNoOptions} value={a.menarche} />
      ) : null}
      <PrintLines label="Historia médica/medicación de uso continuo." value={a.medicalHistory} emptyText={NOT_REPORTED} lines={2} />
      <PrintLines label="Histórico de accidentes o traumas." value={a.accidentsHistory} emptyText={NOT_REPORTED} lines={2} />
      <PrintLines label="Estructura familiar" value={a.familyStructure} emptyText={NOT_REPORTED} lines={2} />
      <PrintLines label="Necesidad de tratamiento general (caries, endodoncia, exodoncia)." value={a.generalTreatmentNeeds} emptyText={NOT_REPORTED} lines={2} />
      <PrintLines label="Características importantes de la herencia." value={a.heredity} emptyText={NOT_REPORTED} lines={2} />
    </PrintPage>
  );
}
