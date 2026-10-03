import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { AccordionSection } from "@/modules/core/components/AccordionSection";
import { FieldHint } from "@/modules/core/components/form/FieldHint";
import { MeasureField } from "@/modules/core/components/form/MeasureField";
import { TextAreaField } from "@/modules/core/components/form/TextAreaField";
import { TextField } from "@/modules/core/components/form/TextField";
import { Accordion } from "@/modules/core/ui/accordion";
import { LONG_TEXT, type RecordFormValues } from "../../schemas/record";
import { INTERMOLAR_NOTE } from "../../config/transversal";
import { CrowdingPredisposition } from "../fields/CrowdingPredisposition";
import { FilledStatus } from "../fields/FilledStatus";
import { IntermolarField } from "../fields/IntermolarField";
import { MoyersIncisorsField } from "../fields/MoyersIncisorsField";
import { MoyersSpaceTable } from "../fields/MoyersSpaceTable";
import { NanceResultTable } from "../fields/NanceResultTable";
import { NanceSpaceRows } from "../fields/NanceSpaceRows";
import { NanceWidthsTable } from "../fields/NanceWidthsTable";
import { WalaToEvTable } from "../fields/WalaToEvTable";
import { ArchDiagram } from "../ArchDiagram";
import { BoltonRatioBlock } from "../fields/BoltonRatioBlock";
import { BoltonWidthsGrid } from "../fields/BoltonWidthsGrid";
import { BOLTON_RATIOS } from "../../config/bolton";

/**
 * Paso 5 (págs. 5–9): los cuatro análisis de modelos (transversal, Moyers, Nance y Bolton), uno
 * por panel plegable para no recorrerlos todos. Se abre el transversal;
 * un análisis con errores de validación se abre solo para que el error no quede oculto. Paciente,
 * edad y sexo se toman del paso 1.
 */
export function Step5Models() {
  const { formState } = useFormContext<RecordFormValues>();
  const [open, setOpen] = useState<string[]>(["transversal"]);
  const withErrors = Object.keys(formState.errors.content?.models ?? {});
  const value = [...new Set([...open, ...withErrors])];

  return (
    <Accordion type="multiple" value={value} onValueChange={setOpen} className="flex flex-col gap-3">
      <AccordionSection
        value="transversal"
        index={1}
        title="Análisis transversal de los modelos"
        description="pág. 5 · anchos inter canino e inter molar, borde WALA y distancias WALA–EV"
        status={<FilledStatus name="content.models.transversal" />}
      >
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
      </AccordionSection>

      <AccordionSection
        value="moyers"
        index={2}
        title="Análisis de Moyers"
        description="pág. 6 · incisivos inferiores, espacio disponible y requerido"
        status={<FilledStatus name="content.models.moyers" />}
      >
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
      </AccordionSection>

      <AccordionSection
        value="nance"
        index={3}
        title="Análisis de Nance"
        description="pág. 7 · discrepancia óseo dentaria: espacio disponible (SA) frente al requerido (ST)"
        status={<FilledStatus name="content.models.nance" />}
      >
        <TextField
          name="content.models.nance.analysisDate"
          label="Fecha del análisis"
          type="date"
          hint="Puede ser anterior al inicio del tratamiento."
        />
        <NanceSpaceRows />
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
          <ArchDiagram className="mx-auto max-w-60" />
          <NanceWidthsTable />
        </div>
        <NanceResultTable />
        <TextAreaField name="content.models.nance.interpretation" label="Interpretación" rows={3} maxLength={LONG_TEXT} />
      </AccordionSection>

      <AccordionSection
        value="bolton"
        index={4}
        title="Análisis de Bolton"
        description="pág. 9 · discrepancia de tamaño dentario entre arcadas: relación total y anterior"
        status={<FilledStatus name="content.models.bolton" />}
      >
        <TextField
          name="content.models.bolton.analysisDate"
          label="Fecha del análisis"
          type="date"
          hint="Puede ser anterior al inicio del tratamiento."
        />
        <BoltonWidthsGrid />
        {BOLTON_RATIOS.map((def) => (
          <BoltonRatioBlock key={def.key} def={def} />
        ))}
        <TextAreaField name="content.models.bolton.interpretation" label="Interpretación" rows={3} maxLength={LONG_TEXT} />
      </AccordionSection>
    </Accordion>
  );
}
