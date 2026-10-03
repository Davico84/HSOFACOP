import { useFormContext, useWatch } from "react-hook-form";
import { CheckboxField } from "@/modules/core/components/form/CheckboxField";
import { ChoiceField } from "@/modules/core/components/form/ChoiceField";
import { MeasureField } from "@/modules/core/components/form/MeasureField";
import { TextField } from "@/modules/core/components/form/TextField";
import { TextAreaField } from "@/modules/core/components/form/TextAreaField";
import type { RecordFormValues } from "../../schemas/record";
import { LONG_TEXT } from "../../schemas/record";
import {
  crossbiteTypeOptions, sideOptions, speeOptions, transverseOptions, verticalOptions, yesNoOptions,
} from "../../config/options";
import { MidlineField } from "../fields/MidlineField";
import { RelationsField } from "../fields/RelationsField";
import { ToothPickerField } from "../fields/ToothPickerField";

/** Paso 4 (págs. 3–4): análisis oclusal y extra. */
export function Step4Occlusal() {
  const { control } = useFormContext<RecordFormValues>();
  const [transverse, vertical, spee, apNormal, mi, mih, family] = useWatch({
    control,
    name: [
      "content.occlusal.transverse", "content.occlusal.vertical", "content.occlusal.speeCurve",
      "content.occlusal.anteroposteriorNormal", "content.occlusal.miDiffersFromRc", "content.occlusal.mihDiffersFromRc",
      "content.occlusal.familyMalocclusion",
    ],
  });


  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="s4-transverse" className="flex flex-col gap-4">
        <h3 id="s4-transverse" className="text-lg font-semibold">Transversal</h3>
        <ChoiceField name="content.occlusal.transverse" label="Relación transversal" options={transverseOptions} vertical />
        {transverse === "UNILATERAL_POSTERIOR_CROSSBITE" ? (
          <ChoiceField name="content.occlusal.crossbiteSide" label="Lado" options={sideOptions} className="ml-6" />
        ) : null}
        <ChoiceField name="content.occlusal.crossbiteType" label="Característica de la mordida cruzada" options={crossbiteTypeOptions} />
      </section>

      <section aria-labelledby="s4-vertical" className="flex flex-col gap-4">
        <h3 id="s4-vertical" className="text-lg font-semibold">Vertical</h3>
        <ChoiceField name="content.occlusal.vertical" label="Relación vertical" options={verticalOptions} />
        {vertical === "DEEP_BITE" ? (
          <MeasureField name="content.occlusal.deepBitePercent" label="Mordida profunda de" unit="%" step={1} className="ml-6" />
        ) : null}
        {vertical === "OPEN_BITE" ? (
          <MeasureField name="content.occlusal.openBiteMm" label="Mordida abierta de" unit="mm" className="ml-6" />
        ) : null}
        <ChoiceField name="content.occlusal.speeCurve" label="Curva de Spee" options={speeOptions} />
        {spee === "ALTERED" ? (
          <TextField name="content.occlusal.speeCurveDetail" label="¿Cómo está alterada?" className="ml-6" />
        ) : null}
      </section>

      <section aria-labelledby="s4-ap" className="flex flex-col gap-4">
        <h3 id="s4-ap" className="text-lg font-semibold">Anteroposterior</h3>
        <CheckboxField name="content.occlusal.anteroposteriorNormal" label="Normal" />
        {apNormal ? null : (
          <>
            <MeasureField name="content.occlusal.overjetMm" label="Overjet aumentado" unit="mm" />
            <ToothPickerField name="content.occlusal.anteriorCrossbiteTeeth" label="Mordida cruzada anterior (piezas)" anteriorOnly />
          </>
        )}
        <MidlineField name="content.occlusal.midlineUpper" label="Línea media superior" />
        <MidlineField name="content.occlusal.midlineLower" label="Línea media inferior" />
        <RelationsField name="content.occlusal.canineRelation" label="Relación de caninos" />
        <RelationsField name="content.occlusal.molarRelation" label="Relación de molares" />
        <div className="flex flex-col gap-3">
          <CheckboxField name="content.occlusal.miDiffersFromRc" label="MI ≠ RC (máxima intercuspidación distinta de relación céntrica)" />
          {mi ? <RelationsField name="content.occlusal.canineRelationMi" label="Relación de caninos en RC (MI ≠ RC)" /> : null}
          <CheckboxField name="content.occlusal.mihDiffersFromRc" label="MIH ≠ RC (mordida habitual distinta de relación céntrica)" />
          {mih ? <RelationsField name="content.occlusal.canineRelationMih" label="Relación de caninos en RC (MIH ≠ RC)" /> : null}
        </div>
      </section>

      <section aria-labelledby="s4-extra" className="flex flex-col gap-4">
        <h3 id="s4-extra" className="text-lg font-semibold">Extra</h3>
        <TextAreaField name="content.occlusal.dentalAnomalies" label="Anomalías dentales (forma / color / número)" maxLength={LONG_TEXT} />
        <TextAreaField name="content.occlusal.tmjCondition" label="Condición de la ATM" maxLength={LONG_TEXT} />
        <ChoiceField name="content.occlusal.familyMalocclusion" label="¿Hay algún familiar con la misma maloclusión?" options={yesNoOptions} />
        {family === "YES" ? <TextField name="content.occlusal.familyMalocclusionWho" label="¿Quién?" className="ml-6" /> : null}
      </section>
    </div>
  );
}
