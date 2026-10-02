import { MeasureField } from "@/modules/core/components/form/MeasureField";
import { TextAreaField } from "@/modules/core/components/form/TextAreaField";
import { TextField } from "@/modules/core/components/form/TextField";
import { LONG_TEXT } from "../../schemas/record";
import { INTERMOLAR_NOTE } from "../../config/transversal";
import { CrowdingPredisposition } from "../fields/CrowdingPredisposition";
import { IntermolarField } from "../fields/IntermolarField";
import { MoyersIncisorsField } from "../fields/MoyersIncisorsField";
import { MoyersSpaceTable } from "../fields/MoyersSpaceTable";
import { WalaToEvTable } from "../fields/WalaToEvTable";

/**
 * Paso 5 (págs. 5–6): análisis de modelos. Por ahora el transversal y Moyers; Nance y Bolton se
 * agregan aquí en sus propios changes. Paciente, edad y sexo se toman del paso 1.
 */
export function Step5Models() {
  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="s5-transversal" className="flex flex-col gap-6">
        <h3 id="s5-transversal" className="text-lg font-semibold">Análisis transversal de los modelos</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <MeasureField name="content.models.transversal.intercanineUpper" label="AIS: ancho inter canino superior" unit="mm" />
          <MeasureField name="content.models.transversal.intercanineLower" label="AII: ancho inter canino inferior" unit="mm" />
          <IntermolarField arch="upper" label="AMS: ancho molar superior" />
          <IntermolarField arch="lower" label="AMI: ancho molar inferior" />
        </div>
        <ul className="border-l-2 border-primary/60 pl-3 text-xs text-muted-foreground">
          {INTERMOLAR_NOTE.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className="grid gap-4 sm:grid-cols-4">
          <MeasureField name="content.models.transversal.walaWidth" label="Ancho borde WALA" unit="mm" />
          <MeasureField name="content.models.transversal.xPcWidth" label="Ancho X Pc" unit="mm" />
          <MeasureField name="content.models.transversal.xPrimePcWidth" label="Ancho X´ Pc" unit="mm" />
          <MeasureField name="content.models.transversal.xIdealWidth" label="Ancho X ideal" unit="mm" />
        </div>
        <WalaToEvTable />
        <TextAreaField name="content.models.transversal.interpretation" label="Interpretación" rows={3} maxLength={LONG_TEXT} />
      </section>

      <section aria-labelledby="s5-moyers" className="flex flex-col gap-6 border-t border-border pt-6">
        <h3 id="s5-moyers" className="text-lg font-semibold">Análisis de Moyers</h3>
        <TextField
          name="content.models.moyers.analysisDate"
          label="Fecha del análisis"
          type="date"
          className="max-w-xs"
          hint="Puede ser anterior al inicio del tratamiento."
        />
        <MoyersIncisorsField />
        <MoyersSpaceTable />
        <CrowdingPredisposition />
        <TextAreaField name="content.models.moyers.interpretation" label="Interpretación" rows={3} maxLength={LONG_TEXT} />
      </section>
    </div>
  );
}
