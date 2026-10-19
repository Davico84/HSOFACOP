import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/modules/core/ui/table";
import type { RecordSummaryResponse } from "@/modules/core/services/generated/model";
import { formatDate, formatDateTime, formatDocument } from "../utils/recordDisplay";
import type { RecordsListView } from "../utils/recordsListView";
import { RecordEditLink } from "./RecordEditLink";
import { RecordLockIcon } from "./RecordLockIcon";
import { RecordPatientLink } from "./RecordPatientLink";
import { RecordPrintLink } from "./RecordPrintLink";

interface RecordsTableProps {
  records: RecordSummaryResponse[];
  /** "all" (ADMIN) suma la columna Autor; "cohorts" (coordinación) suma Alumno y Turma y es de solo lectura. */
  view: RecordsListView;
}

export function RecordsTable({ records, view }: RecordsTableProps) {
  const readOnly = view === "cohorts";
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Número</TableHead>
          <TableHead>Paciente</TableHead>
          <TableHead>Documento</TableHead>
          <TableHead>Odontólogo tratante</TableHead>
          <TableHead>Inicio</TableHead>
          <TableHead>Modificada</TableHead>
          {view === "all" ? <TableHead>Autor</TableHead> : null}
          {readOnly ? <TableHead>Alumno</TableHead> : null}
          {readOnly ? <TableHead>Turma</TableHead> : null}
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <TableRow key={record.id}>
            <TableCell className="font-medium whitespace-nowrap">
              <span className="inline-flex items-center gap-1.5">
                {record.recordNumber}
                {record.patientLocked ? <RecordLockIcon /> : null}
              </span>
            </TableCell>
            <TableCell>
              <RecordPatientLink
                id={record.id}
                patientName={record.patientName}
                readOnly={readOnly}
                className="font-medium text-primary underline-offset-4 hover:underline"
              />
            </TableCell>
            <TableCell className="whitespace-nowrap">{formatDocument(record.documentType, record.documentNumber)}</TableCell>
            <TableCell>{record.treatingDentist ?? ""}</TableCell>
            <TableCell className="whitespace-nowrap">{formatDate(record.treatmentStartDate)}</TableCell>
            <TableCell className="whitespace-nowrap">{formatDateTime(record.updatedAt)}</TableCell>
            {view === "all" || readOnly ? <TableCell>{record.authorName}</TableCell> : null}
            {readOnly ? <TableCell>{record.cohortName ?? ""}</TableCell> : null}
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                {readOnly ? null : <RecordEditLink id={record.id} recordNumber={record.recordNumber} />}
                <RecordPrintLink id={record.id} recordNumber={record.recordNumber} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
