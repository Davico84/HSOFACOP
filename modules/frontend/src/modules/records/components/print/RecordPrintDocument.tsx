import type { RecordResponse } from "@/modules/core/services/generated/model";
import { PrintDiagnosisSection } from "./PrintDiagnosisSection";
import { PrintFacialSection } from "./PrintFacialSection";
import { PrintFunctionalSection } from "./PrintFunctionalSection";
import { PrintOcclusalSection } from "./PrintOcclusalSection";
import { PrintPatientSection } from "./PrintPatientSection";
import { PrintRadiographicSection } from "./PrintRadiographicSection";
import { PrintSignaturesSection } from "./PrintSignaturesSection";

interface RecordPrintDocumentProps {
  record: RecordResponse;
}

/** La historia completa en hojas A4, en el orden y con los títulos del PDF (fase 1). */
export function RecordPrintDocument({ record }: RecordPrintDocumentProps) {
  return (
    <div className="flex flex-col gap-8 py-8 font-[Arial,Helvetica,sans-serif] text-[10pt] leading-[17.3pt] text-foreground print:gap-0 print:py-0">
      <PrintPatientSection record={record} />
      <PrintFacialSection record={record} />
      <PrintFunctionalSection record={record} />
      <PrintOcclusalSection record={record} />
      <PrintRadiographicSection record={record} />
      <PrintDiagnosisSection record={record} />
      <PrintSignaturesSection record={record} />
    </div>
  );
}
