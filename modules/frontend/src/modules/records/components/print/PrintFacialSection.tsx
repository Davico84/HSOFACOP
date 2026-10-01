import type { RecordResponse } from "@/modules/core/services/generated/model";
import {
  afaiOptions, chinNeckAngleOptions, chinNeckLineOptions, convexityOptions, facialThirdOptions, facialThirdsOptions,
  facialTypeOptions, lipRelationOptions, mentolabialOptions, nasolabialOptions, patternIIFeatureOptions,
  patternIIIFeatureOptions, presenceOptions, sideOptions, zygomaticOptions,
} from "../../config/options";
import { PrintChoice } from "./PrintChoice";
import { PrintPage } from "./PrintPage";

interface PrintFacialSectionProps {
  record: RecordResponse;
}

/** Pág. 2: análisis facial, en una sola hoja, solo casillas (sin las imágenes de la guía). */
export function PrintFacialSection({ record }: PrintFacialSectionProps) {
  const f = record.content.facial;
  const pattern = f.facialPattern;
  return (
    <PrintPage recordNumber={record.recordNumber} title="Análisis facial">
      <PrintChoice label="1. TIPO FACIAL:" options={facialTypeOptions} value={f.facialType} />
      <PrintChoice label="2. CONVEXIDAD:" options={convexityOptions} value={f.convexity} />
      <PrintChoice label="3. PROPORCIÓN DE LOS TERCIOS FACIALES:" options={facialThirdsOptions} value={f.facialThirds} />
      <div className="pl-6"><PrintChoice label="Tercio:" options={facialThirdOptions} value={f.facialThirdsAffected} /></div>
      <PrintChoice label="4. SELLADO LABIAL:" options={presenceOptions} value={f.lipSeal} />
      <PrintChoice label="5. RELACIÓN ANTEROPOSTERIOR DE LABIOS:" options={lipRelationOptions} value={f.lipAnteroposteriorRelation} />
      <div className="flex flex-wrap gap-x-6">
        <PrintChoice label="6. SIMETRÍA FACIAL EN REPOSO:" options={presenceOptions} value={f.restSymmetry} />
        <PrintChoice label="Lado:" options={sideOptions} value={f.restAsymmetrySides} />
      </div>
      <div className="flex flex-wrap gap-x-6">
        <PrintChoice label="7. SIMETRÍA FACIAL EN APERTURA BUCAL:" options={presenceOptions} value={f.openingSymmetry} />
        <PrintChoice label="Lado:" options={sideOptions} value={f.openingAsymmetrySides} />
      </div>
      <PrintChoice label="8. ÁNGULO NASOLABIAL:" options={nasolabialOptions} value={f.nasolabialAngle} />
      <PrintChoice label="9. SURCO MENTOLABIAL:" options={mentolabialOptions} value={f.mentolabialSulcus} />
      <PrintChoice label="10. PROYECCIÓN CIGOMÁTICA:" options={zygomaticOptions} value={f.zygomaticProjection} />
      <PrintChoice label="11. LÍNEA MENTÓN CUELLO:" options={chinNeckLineOptions} value={f.chinNeckLine} />
      <PrintChoice label="12. ÁNGULO MENTÓN CUELLO:" options={chinNeckAngleOptions} value={f.chinNeckAngle} />
      <p>13. PATRÓN FACIAL</p>
      <div className="flex flex-col gap-0.5 pl-6">
        <p>{pattern === "PATTERN_I" ? "☒" : "☐"} Patrón I</p>
        <div className="flex flex-wrap gap-x-4">
          <span>{pattern === "PATTERN_II" ? "☒" : "☐"} Patrón II:</span>
          <PrintChoice options={patternIIFeatureOptions} value={f.patternIIFeatures} />
          <PrintChoice options={afaiOptions} value={f.patternIIAfai} />
        </div>
        <div className="flex flex-wrap gap-x-4">
          <span>{pattern === "PATTERN_III" ? "☒" : "☐"} Patrón III:</span>
          <PrintChoice options={patternIIIFeatureOptions} value={f.patternIIIFeatures} />
          <PrintChoice options={afaiOptions} value={f.patternIIIAfai} />
        </div>
        <p>
          {pattern === "SHORT_FACE" ? "☒" : "☐"} Cara corta &nbsp;&nbsp; {pattern === "LONG_FACE" ? "☒" : "☐"} Cara larga
        </p>
      </div>
      <p className="mt-2">(Adjuntar fotografías impresas en papel fotográfico)</p>
    </PrintPage>
  );
}
