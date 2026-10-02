import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { FieldHint } from "@/modules/core/components/form/FieldHint";
import { MeasureField } from "@/modules/core/components/form/MeasureField";
import { TextAreaField } from "@/modules/core/components/form/TextAreaField";
import { TextField } from "@/modules/core/components/form/TextField";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/modules/core/ui/accordion";
import { LONG_TEXT, type RecordFormValues } from "../../schemas/record";
import { INTERMOLAR_NOTE } from "../../config/transversal";
import { CrowdingPredisposition } from "../fields/CrowdingPredisposition";
import { IntermolarField } from "../fields/IntermolarField";
import { MoyersIncisorsField } from "../fields/MoyersIncisorsField";
import { MoyersSpaceTable } from "../fields/MoyersSpaceTable";
import { WalaToEvTable } from "../fields/WalaToEvTable";

const TRIGGER = "text-lg font-semibold hover:no-underline";
// El panel recorta lo que sobresale (lo necesita su animación): este margen deja espacio al anillo
// de foco de los campos pegados al borde.
const CONTENT = "flex flex-col gap-6 px-1.5 pt-1.5";

/**
 * Paso 5 (págs. 5–6): análisis de modelos, uno por panel plegable para no recorrer los cuatro
 * (transversal y Moyers; Nance y Bolton se agregan en sus propios changes). Se abre el transversal;
 * un análisis con errores de validación se abre solo para que el error no quede oculto. Paciente,
 * edad y sexo se toman del paso 1.
 */
export function Step5Models() {
  const { formState } = useFormContext<RecordFormValues>();
  const [open, setOpen] = useState<string[]>(["transversal"]);
  const withErrors = Object.keys(formState.errors.content?.models ?? {});
  const value = [...new Set([...open, ...withErrors])];

  return (
    <Accordion type="multiple" value={value} onValueChange={setOpen} className="rounded-lg border border-border px-4">
      <AccordionItem value="transversal">
        <AccordionTrigger className={TRIGGER}>Análisis transversal de los modelos</AccordionTrigger>
        <AccordionContent className={CONTENT}>
          <div className="grid gap-4 sm:grid-cols-2">
            <MeasureField name="content.models.transversal.intercanineUpper" label="AIS: ancho inter canino superior" unit="mm" />
            <MeasureField name="content.models.transversal.intercanineLower" label="AII: ancho inter canino inferior" unit="mm" />
            <IntermolarField arch="upper" label="AMS: ancho molar superior" />
            <IntermolarField arch="lower" label="AMI: ancho molar inferior" />
          </div>
          <FieldHint>
            <ul>
              {INTERMOLAR_NOTE.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </FieldHint>
          <div className="grid gap-4 sm:grid-cols-4">
            <MeasureField name="content.models.transversal.walaWidth" label="Ancho borde WALA" unit="mm" />
            <MeasureField name="content.models.transversal.xPcWidth" label="Ancho X Pc" unit="mm" />
            <MeasureField name="content.models.transversal.xPrimePcWidth" label="Ancho X´ Pc" unit="mm" />
            <MeasureField name="content.models.transversal.xIdealWidth" label="Ancho X ideal" unit="mm" />
          </div>
          <WalaToEvTable />
          <TextAreaField name="content.models.transversal.interpretation" label="Interpretación" rows={3} maxLength={LONG_TEXT} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="moyers">
        <AccordionTrigger className={TRIGGER}>Análisis de Moyers</AccordionTrigger>
        <AccordionContent className={CONTENT}>
          <TextField
            name="content.models.moyers.analysisDate"
            label="Fecha del análisis"
            type="date"
            hint="Puede ser anterior al inicio del tratamiento."
          />
          <MoyersIncisorsField />
          <MoyersSpaceTable />
          <CrowdingPredisposition />
          <TextAreaField name="content.models.moyers.interpretation" label="Interpretación" rows={3} maxLength={LONG_TEXT} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
