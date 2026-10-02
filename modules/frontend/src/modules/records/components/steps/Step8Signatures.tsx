import { useFormContext, useWatch } from "react-hook-form";
import { TextField } from "@/modules/core/components/form/TextField";
import type { RecordFormValues } from "../../schemas/record";
import { ageYears, isMinor } from "../../utils/age";

/**
 * Paso 8 (pág. 13): nombres de quienes firman sobre el papel. Si el paciente es menor de edad
 * firma el apoderado (nombre y parentesco). La fecha se llena a mano en la hoja impresa.
 */
export function Step8Signatures() {
  const { control } = useFormContext<RecordFormValues>();
  const [birthDate, startDate, patientName, treatingDentist] = useWatch({
    control,
    name: ["birthDate", "treatmentStartDate", "patientName", "treatingDentist"],
  });
  const minor = isMinor(ageYears(birthDate, startDate));

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Las firmas y la fecha se hacen a mano sobre la hoja impresa; aquí solo se escriben los nombres.
      </p>
      {minor ? (
        <fieldset className="grid gap-4 md:grid-cols-2">
          <legend className="mb-2 text-sm font-semibold">Firma del apoderado (paciente menor de edad)</legend>
          <TextField name="content.signatures.guardianName" label="Nombre del apoderado" />
          <TextField name="content.signatures.guardianRelationship" label="Parentesco" placeholder="Madre, padre, tutor…" />
        </fieldset>
      ) : (
        <fieldset className="grid gap-4">
          <legend className="mb-2 text-sm font-semibold">Firma del paciente</legend>
          <TextField name="content.signatures.patientSignatureName" label="Nombre del paciente" placeholder={patientName ?? ""}
            hint="Si se deja vacío se imprime el nombre del paciente." />
        </fieldset>
      )}
      <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="mb-2 text-sm font-semibold">Firma supervisor</legend>
        <TextField name="content.signatures.supervisor1Name" label="Supervisor 1" />
        <TextField name="content.signatures.supervisor2Name" label="Supervisor 2" />
      </fieldset>
      <fieldset className="grid gap-4">
        <legend className="mb-2 text-sm font-semibold">Firma del tratante</legend>
        <TextField name="content.signatures.treatingSignatureName" label="Nombre del tratante" placeholder={treatingDentist ?? ""}
          hint="Si se deja vacío se imprime el odontólogo tratante." />
      </fieldset>
    </div>
  );
}
