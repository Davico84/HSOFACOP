import { ItemListField } from "@/modules/core/components/form/ItemListField";
import { TextAreaField } from "@/modules/core/components/form/TextAreaField";
import { LIST_ITEM, LIST_ITEMS, LONG_TEXT } from "../../schemas/record";

/** Paso 7 (págs. 11–13): diagnóstico, problemas y metas (listas), dos planes, secuencia y plan final. */
export function Step7Diagnosis() {
  return (
    <div className="flex flex-col gap-6">
      <TextAreaField name="content.diagnosis.generalDiagnosis" label="Diagnóstico general" rows={8} maxLength={LONG_TEXT} />
      <ItemListField name="content.diagnosis.problemList" label="Lista de problemas" itemName="problema" maxItems={LIST_ITEMS} maxLength={LIST_ITEM} />
      <ItemListField name="content.diagnosis.treatmentGoals" label="Metas de tratamiento" itemName="meta" maxItems={LIST_ITEMS} maxLength={LIST_ITEM} />
      <div className="grid gap-6 lg:grid-cols-2">
        <TextAreaField name="content.diagnosis.treatmentPlan1" label="Plan de tratamiento 1" rows={8} maxLength={LONG_TEXT} />
        <TextAreaField name="content.diagnosis.treatmentPlan2" label="Plan de tratamiento 2" rows={8} maxLength={LONG_TEXT} />
      </div>
      <TextAreaField name="content.diagnosis.treatmentSequence" label="Secuencia de tratamiento" rows={6} maxLength={LONG_TEXT} />
      <TextAreaField name="content.diagnosis.nextStages" label="Posibles próximas etapas" rows={3} maxLength={LONG_TEXT} />
      <TextAreaField name="content.diagnosis.finalTreatmentPlan" label="Plan de tratamiento final" rows={6} maxLength={LONG_TEXT} />
    </div>
  );
}
