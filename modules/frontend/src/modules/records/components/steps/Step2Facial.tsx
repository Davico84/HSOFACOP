import { useFormContext, useWatch } from "react-hook-form";
import { ChoiceField } from "@/modules/core/components/form/ChoiceField";
import { MultiChoiceField } from "@/modules/core/components/form/MultiChoiceField";
import type { RecordFormValues } from "../../schemas/record";
import {
  afaiOptions, anguloMentonCuelloImg, anguloNasolabialImg, chinNeckAngleOptions, chinNeckLineOptions,
  convexityOptions, facialHints, facialPatternOptions, facialThirdOptions, facialThirdsOptions, facialTypeOptions,
  lineaMentonCuelloImg, lipRelationOptions, mentolabialOptions, nasolabialOptions, patternIIFeatureOptions,
  patternIIIFeatureOptions, presenceOptions, selladoLabialImg, sideOptions, simetriaImg, surcoMentolabialImg,
  terciosImg, zygomaticOptions,
} from "../../config/options";

/**
 * Paso 2 (pág. 2): análisis facial con las opciones e ilustraciones de la Guía de análisis
 * facial. Los detalles (tercio afectado, lado, rasgos del patrón) aparecen solo cuando aplican.
 */
export function Step2Facial() {
  const { control } = useFormContext<RecordFormValues>();
  const [thirds, rest, opening, pattern] = useWatch({
    control,
    name: ["content.facial.facialThirds", "content.facial.restSymmetry", "content.facial.openingSymmetry", "content.facial.facialPattern"],
  });

  return (
    <div className="flex flex-col gap-8">
      <ChoiceField name="content.facial.facialType" label="1. Tipo facial" options={facialTypeOptions} hint={facialHints.facialType} />
      <ChoiceField name="content.facial.convexity" label="2. Convexidad" options={convexityOptions} hint={facialHints.convexity} />
      <div className="flex flex-col gap-3">
        <ChoiceField name="content.facial.facialThirds" label="3. Proporción de los tercios faciales" options={facialThirdsOptions}
          referenceImage={terciosImg} hint={facialHints.facialThirds} vertical />
        {thirds === "ABSENT_INCREASED" || thirds === "ABSENT_DECREASED" ? (
          <MultiChoiceField name="content.facial.facialThirdsAffected" label="¿Qué tercio?" options={facialThirdOptions} className="ml-6" />
        ) : null}
      </div>
      <ChoiceField name="content.facial.lipSeal" label="4. Sellado labial" options={presenceOptions}
        referenceImage={selladoLabialImg} hint={facialHints.lipSeal} />
      <ChoiceField name="content.facial.lipAnteroposteriorRelation" label="5. Relación anteroposterior de labios"
        options={lipRelationOptions} hint={facialHints.lipRelation} />
      <div className="flex flex-col gap-3">
        <ChoiceField name="content.facial.restSymmetry" label="6. Simetría facial en reposo" options={presenceOptions}
          referenceImage={simetriaImg} hint={facialHints.restSymmetry} />
        {rest === "ABSENT" ? (
          <MultiChoiceField name="content.facial.restAsymmetrySides" label="Lado asimétrico" options={sideOptions} className="ml-6" />
        ) : null}
      </div>
      <div className="flex flex-col gap-3">
        <ChoiceField name="content.facial.openingSymmetry" label="7. Simetría facial en apertura bucal" options={presenceOptions}
          hint={facialHints.openingSymmetry} />
        {opening === "ABSENT" ? (
          <MultiChoiceField name="content.facial.openingAsymmetrySides" label="Lado asimétrico" options={sideOptions} className="ml-6" />
        ) : null}
      </div>
      <ChoiceField name="content.facial.nasolabialAngle" label="8. Ángulo nasolabial" options={nasolabialOptions}
        referenceImage={anguloNasolabialImg} hint={facialHints.nasolabial} />
      <ChoiceField name="content.facial.mentolabialSulcus" label="9. Surco mentolabial" options={mentolabialOptions}
        referenceImage={surcoMentolabialImg} hint={facialHints.mentolabial} />
      <ChoiceField name="content.facial.zygomaticProjection" label="10. Proyección cigomática" options={zygomaticOptions}
        hint={facialHints.zygomatic} />
      <ChoiceField name="content.facial.chinNeckLine" label="11. Línea mentón-cuello" options={chinNeckLineOptions}
        referenceImage={lineaMentonCuelloImg} hint={facialHints.chinNeckLine} />
      <ChoiceField name="content.facial.chinNeckAngle" label="12. Ángulo mentón-cuello" options={chinNeckAngleOptions}
        referenceImage={anguloMentonCuelloImg} hint={facialHints.chinNeckAngle} />
      <div className="flex flex-col gap-3">
        <ChoiceField name="content.facial.facialPattern" label="13. Patrón facial" options={facialPatternOptions} />
        {pattern === "PATTERN_II" ? (
          <div className="ml-6 flex flex-col gap-3">
            <MultiChoiceField name="content.facial.patternIIFeatures" label="Patrón II" options={patternIIFeatureOptions} />
            <ChoiceField name="content.facial.patternIIAfai" label="AFAI (excluyentes)" options={afaiOptions} />
          </div>
        ) : null}
        {pattern === "PATTERN_III" ? (
          <div className="ml-6 flex flex-col gap-3">
            <MultiChoiceField name="content.facial.patternIIIFeatures" label="Patrón III" options={patternIIIFeatureOptions} />
            <ChoiceField name="content.facial.patternIIIAfai" label="AFAI (excluyentes)" options={afaiOptions} />
          </div>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">(Adjuntar fotografías impresas en papel fotográfico)</p>
    </div>
  );
}
