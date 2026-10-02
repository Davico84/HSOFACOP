import type { RecordResponse } from "@/modules/core/services/generated/model";
import {
  afaiOptions, chinNeckAngleOptions, chinNeckLineOptions, convexityOptions, facialTypeOptions, lipRelationOptions,
  mentolabialOptions, nasolabialOptions, patternIIFeatureOptions, patternIIIFeatureOptions, presenceOptions,
  zygomaticOptions,
} from "../../config/options";
import { PrintChoice } from "./PrintChoice";
import { PrintLines } from "./PrintLines";
import { PrintPage } from "./PrintPage";

interface PrintFacialSectionProps {
  record: RecordResponse;
}

/** AFAI con etiquetas cortas para que el patrón quepa en un renglón. */
const AFAI_SHORT = afaiOptions.map((o) => ({ ...o, label: o.value === "INCREASED" ? "AFAI aumentada" : "AFAI disminuida" }));

const mark = (on: boolean) => (on ? "☒" : "☐");

/**
 * Pág. 2: análisis facial en una sola hoja: cada pregunta con sus opciones en el renglón siguiente
 * (juntas si caben; si no, una por renglón); tercios y simetrías con 2 renglones de texto; sin imágenes.
 */
export function PrintFacialSection({ record }: PrintFacialSectionProps) {
  const f = record.content.facial;
  const pattern = f.facialPattern;
  return (
    <PrintPage recordNumber={record.recordNumber} title="Análisis facial">
      <PrintChoice label="1. TIPO FACIAL:" options={facialTypeOptions} value={f.facialType} />
      <PrintChoice label="2. CONVEXIDAD:" options={convexityOptions} value={f.convexity} />
      <PrintChoice label="3. PROPORCIÓN DE LOS TERCIOS FACIALES:" options={presenceOptions} value={f.facialThirds} />
      <PrintLines value={f.facialThirdsNotes} lines={2} />
      <PrintChoice label="4. SELLADO LABIAL:" options={presenceOptions} value={f.lipSeal} />
      <PrintChoice label="5. RELACIÓN ANTEROPOSTERIOR DE LABIOS:" options={lipRelationOptions} value={f.lipAnteroposteriorRelation} />
      <PrintChoice label="6. SIMETRÍA FACIAL EN REPOSO:" options={presenceOptions} value={f.restSymmetry} />
      <PrintLines value={f.restSymmetryNotes} lines={2} />
      <PrintChoice label="7. SIMETRÍA FACIAL EN APERTURA BUCAL:" options={presenceOptions} value={f.openingSymmetry} />
      <PrintLines value={f.openingSymmetryNotes} lines={2} />
      <PrintChoice label="8. ÁNGULO NASOLABIAL:" options={nasolabialOptions} value={f.nasolabialAngle} />
      <PrintChoice label="9. SURCO MENTOLABIAL:" options={mentolabialOptions} value={f.mentolabialSulcus} />
      <PrintChoice label="10. PROYECCIÓN CIGOMÁTICA:" options={zygomaticOptions} value={f.zygomaticProjection} />
      <PrintChoice label="11. LÍNEA MENTÓN CUELLO:" options={chinNeckLineOptions} value={f.chinNeckLine} />
      <PrintChoice label="12. ÁNGULO MENTÓN CUELLO:" options={chinNeckAngleOptions} value={f.chinNeckAngle} />
      <p>13. PATRÓN FACIAL</p>
      <div className="flex flex-col pl-[8mm]">
        <p className="flex flex-wrap gap-x-[14pt]">
          <span>{mark(pattern === "PATTERN_I")} Patrón I</span>
          <span>{mark(pattern === "SHORT_FACE")} Cara corta</span>
          <span>{mark(pattern === "LONG_FACE")} Cara larga</span>
        </p>
        <div className="flex flex-wrap gap-x-[10pt]">
          <span>{mark(pattern === "PATTERN_II")} Patrón II:</span>
          <PrintChoice options={patternIIFeatureOptions} value={f.patternIIFeatures} />
          <PrintChoice options={AFAI_SHORT} value={f.patternIIAfai} />
        </div>
        <div className="flex flex-wrap gap-x-[10pt]">
          <span>{mark(pattern === "PATTERN_III")} Patrón III:</span>
          <PrintChoice options={patternIIIFeatureOptions} value={f.patternIIIFeatures} />
          <PrintChoice options={AFAI_SHORT} value={f.patternIIIAfai} />
        </div>
      </div>
      <p className="mt-[7pt]">(Adjuntar fotografías impresas en papel fotográfico)</p>
    </PrintPage>
  );
}
