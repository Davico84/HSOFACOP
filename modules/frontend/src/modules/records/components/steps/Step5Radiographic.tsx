import { useFormContext, useWatch } from "react-hook-form";
import { MultiChoiceField } from "@/modules/core/components/form/MultiChoiceField";
import { TextAreaField } from "@/modules/core/components/form/TextAreaField";
import type { RecordFormValues } from "../../schemas/record";
import { LONG_TEXT } from "../../schemas/record";
import { CEPHALOMETRIC_REQUIRED, cephalometricOptions } from "../../config/options";

/** Paso 5 (pág. 10): análisis radiográfico. El PDF pide 3 análisis cefalométricos (aviso, no bloqueo). */
export function Step5Radiographic() {
  const { control } = useFormContext<RecordFormValues>();
  const analyses = useWatch({ control, name: "content.radiographic.cephalometricAnalyses" });
  const count = analyses?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <TextAreaField name="content.radiographic.panoramicDiagnosis" label="Diagnóstico de la radiografía panorámica" rows={4} maxLength={LONG_TEXT} />
      <MultiChoiceField
        name="content.radiographic.cephalometricAnalyses"
        label="Diagnóstico cefalométrico (realizar 3 análisis cefalométricos)"
        options={cephalometricOptions}
        footer={`${count} de ${CEPHALOMETRIC_REQUIRED}`}
      />
      <TextAreaField name="content.radiographic.apicalBases" label="Alteraciones cefalométricas de las bases apicales" rows={5} maxLength={LONG_TEXT} />
      <TextAreaField name="content.radiographic.growthTendency" label="Alteraciones cefalométricas en relación a la tendencia de crecimiento" rows={5} maxLength={LONG_TEXT} />
      <TextAreaField name="content.radiographic.dentoalveolar" label="Alteraciones cefalométricas en relación a los aspectos dentoalveolares" rows={5} maxLength={LONG_TEXT} />
      <TextAreaField name="content.radiographic.others" label="Otros" rows={4} maxLength={LONG_TEXT} />
    </div>
  );
}
