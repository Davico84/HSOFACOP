import type { RecordResponse } from "@/modules/core/services/generated/model";
import { cephalometricOptions } from "../../config/options";
import { PrintChoice } from "./PrintChoice";
import { PrintLines } from "./PrintLines";
import { PrintPage } from "./PrintPage";
import { LABEL } from "./printStyle";

interface PrintRadiographicSectionProps {
  record: RecordResponse;
}

/** Pág. 10: análisis radiográfico. */
export function PrintRadiographicSection({ record }: PrintRadiographicSectionProps) {
  const r = record.content.radiographic;
  return (
    <PrintPage recordNumber={record.recordNumber} title="Análisis radiográfico">
      <PrintLines label="Diagnóstico de la radiografía panorámica" value={r.panoramicDiagnosis} lines={4} />
      <p className={`mt-[7pt] ${LABEL}`}>Diagnóstico cefalométrico (realizar 3 análisis cefalométricos) e indicar en su diagnóstico</p>
      <PrintChoice label="Análisis realizados:" options={cephalometricOptions} value={r.cephalometricAnalyses} />
      <div className="pl-[8mm]">
        <PrintLines label="Alteraciones cefalométricas de las bases apicales." value={r.apicalBases} lines={5} />
        <PrintLines label="Alteraciones cefalométricas en relación a la tendencia de crecimiento." value={r.growthTendency} lines={5} />
        <PrintLines label="Alteraciones cefalométricas en relación a los aspectos dento alveolares." value={r.dentoalveolar} lines={5} />
        <PrintLines label="Otros" value={r.others} lines={4} />
      </div>
    </PrintPage>
  );
}
