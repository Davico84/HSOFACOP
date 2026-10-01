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
    <div className="mx-auto flex max-w-[210mm] flex-col gap-8 bg-background p-[15mm] text-[10.5pt] leading-snug text-foreground print:max-w-none print:gap-0 print:p-0">
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
