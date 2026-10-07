import { useFormContext, useWatch } from "react-hook-form";
import { TextField } from "@/modules/core/components/form/TextField";
import { TextAreaField } from "@/modules/core/components/form/TextAreaField";
import { ChoiceField } from "@/modules/core/components/form/ChoiceField";
import { FormField } from "@/modules/core/components/form/FormField";
import { Input } from "@/modules/core/ui/input";
import type { RecordFormValues } from "../../schemas/record";
import { LONG_TEXT } from "../../schemas/record";
import { cooperationOptions, documentTypeOptions, NOT_REPORTED, oralHygieneOptions, sexOptions, yesNoOptions } from "../../config/options";
import { ageYears } from "../../utils/age";
import { formatAge } from "../../utils/recordDisplay";

interface Step1PatientProps {
  /**
   * Datos del paciente fijos tras imprimir: nombre, documento, sexo, fecha y lugar de nacimiento de
   * solo lectura (siguen en el formulario y se envían sin cambios al guardar).
   */
  patientLocked?: boolean;
}

/** Paso 1 (pág. 1): datos del paciente y anamnesis. La edad se calcula (no se teclea). */
export function Step1Patient({ patientLocked = false }: Step1PatientProps) {
  const { control } = useFormContext<RecordFormValues>();
  const [birthDate, startDate, sex, menarche] = useWatch({
    control,
    name: ["birthDate", "treatmentStartDate", "patientSex", "content.anamnesis.menarche"],
  });
  const age = ageYears(birthDate, startDate);

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="s1-patient" className="grid gap-4 md:grid-cols-2">
        <h3 id="s1-patient" className="text-lg font-semibold md:col-span-2">Paciente</h3>
        <TextField name="recordNumber" label="Nro. de historia" placeholder="AOC-0001" autoComplete="off"
          hint="Lo asignan los docentes. Se puede corregir aunque la historia ya esté impresa." />
        <TextField name="treatingDentist" label="Odontólogo tratante" />
        <TextField name="patientName" label="Paciente" className="md:col-span-2" autoComplete="off" readOnly={patientLocked} />
        <ChoiceField name="patientSex" label="Sexo" options={sexOptions} readOnly={patientLocked} />
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
          <ChoiceField name="documentType" label="Documento" options={documentTypeOptions} vertical readOnly={patientLocked} />
          <TextField name="documentNumber" label="Número" inputMode="numeric" autoComplete="off" readOnly={patientLocked} />
        </div>
        <TextField name="birthPlace" label="Lugar de nacimiento" readOnly={patientLocked} />
        <TextField name="birthDate" label="Fecha de nacimiento" type="date" readOnly={patientLocked} />
        <FormField id="f-age" label="Edad">
          <Input id="f-age" value={formatAge(age) || "—"} readOnly disabled />
        </FormField>
        <TextField name="treatmentStartDate" label="Fecha de inicio de tratamiento" type="date" />
        <TextField name="address" label="Domicilio" className="md:col-span-2" />
        <TextField name="phone" label="Celular" inputMode="tel" />
      </section>

      <section aria-labelledby="s1-anamnesis" className="flex flex-col gap-4">
        <h3 id="s1-anamnesis" className="text-lg font-semibold">Anamnesis</h3>
        <p className="text-sm text-muted-foreground">Los textos que se dejen vacíos se imprimen como "{NOT_REPORTED}".</p>
        <TextAreaField name="content.anamnesis.chiefComplaint" label="Queja principal – ¿Por qué buscó tratamiento?" maxLength={LONG_TEXT} placeholder={NOT_REPORTED} />
        <TextAreaField name="content.anamnesis.personalPreferences" label="Gustos personales (color, canal preferido en YouTube, juguetes)" maxLength={LONG_TEXT} placeholder={NOT_REPORTED} />
        <ChoiceField name="content.anamnesis.cooperation" label="Índice de colaboración / cooperación" options={cooperationOptions} />
        <div className="grid gap-4 md:grid-cols-2">
          <ChoiceField name="content.anamnesis.oralHygiene" label="Higiene oral" options={oralHygieneOptions} />
          <ChoiceField name="content.anamnesis.suckingHabits" label="Hábitos de succión" options={yesNoOptions}
            hint="El detalle (dedos, lengua…) se marca en el análisis funcional." />
        </div>
        {sex === "FEMALE" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <ChoiceField name="content.anamnesis.menarche" label="¿La 1ª menstruación ya ocurrió?" options={yesNoOptions} />
            {menarche === "YES" ? (
              <TextField name="content.anamnesis.menarcheDate" label="Fecha de la 1ª menstruación" type="date" />
            ) : null}
          </div>
        ) : null}
        <TextAreaField name="content.anamnesis.medicalHistory" label="Historia médica / medicación de uso continuo" maxLength={LONG_TEXT} placeholder={NOT_REPORTED} />
        <TextAreaField name="content.anamnesis.accidentsHistory" label="Histórico de accidentes o traumas" maxLength={LONG_TEXT} placeholder={NOT_REPORTED} />
        <TextAreaField name="content.anamnesis.familyStructure" label="Estructura familiar" maxLength={LONG_TEXT} placeholder={NOT_REPORTED} />
        <TextAreaField name="content.anamnesis.generalTreatmentNeeds" label="Necesidad de tratamiento general (caries, endodoncia, exodoncia)" maxLength={LONG_TEXT} placeholder={NOT_REPORTED} />
        <TextAreaField name="content.anamnesis.heredity" label="Características importantes de la herencia" maxLength={LONG_TEXT} placeholder={NOT_REPORTED} />
      </section>
    </div>
  );
}
