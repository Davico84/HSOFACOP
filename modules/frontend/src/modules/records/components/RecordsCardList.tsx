import { Link } from "react-router-dom";
import type { RecordSummaryResponse } from "@/modules/core/services/generated/model";
import { recordPath } from "@/routes/paths";
import { formatDate, formatDateTime, formatDocument } from "../utils/recordDisplay";
import { RecordEditLink } from "./RecordEditLink";
import { RecordPrintLink } from "./RecordPrintLink";

interface RecordsCardListProps {
  records: RecordSummaryResponse[];
  /** Autor: solo para ADMIN (ve las historias de todos). */
  showAuthor: boolean;
}

/**
 * Listado en tarjetas para celular y tablet: los mismos datos que la tabla, con "Editar" y "Vista
 * previa" siempre visibles (en la tabla quedaban fuera de la pantalla).
 */
export function RecordsCardList({ records, showAuthor }: RecordsCardListProps) {
  return (
    <ul className="flex flex-col gap-3" aria-label="Historias clínicas">
      {records.map((record) => {
        const details: [string, string][] = [
          ["Documento", formatDocument(record.documentType, record.documentNumber)],
          ["Odontólogo tratante", record.treatingDentist ?? ""],
          ["Inicio", formatDate(record.treatmentStartDate)],
          ["Modificada", formatDateTime(record.updatedAt)],
          ...(showAuthor ? ([["Autor", record.authorName]] as [string, string][]) : []),
        ];
        return (
          <li key={record.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold tracking-wide text-muted-foreground">{record.recordNumber}</span>
              <h3 className="text-base font-semibold">
                <Link to={recordPath(record.id)} className="text-primary underline-offset-4 hover:underline">
                  {record.patientName}
                </Link>
              </h3>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              {details.map(([label, value]) => (
                <div key={label} className="contents">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="min-w-0 break-words">{value || "—"}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap gap-2">
              <RecordEditLink id={record.id} recordNumber={record.recordNumber} />
              <RecordPrintLink id={record.id} recordNumber={record.recordNumber} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
