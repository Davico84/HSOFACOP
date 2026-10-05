import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/modules/core/ui/table";
import type { RecordSummaryResponse } from "@/modules/core/services/generated/model";
import { recordPath } from "@/routes/paths";
import { formatDate, formatDateTime, formatDocument } from "../utils/recordDisplay";
import { RecordEditLink } from "./RecordEditLink";
import { RecordLockIcon } from "./RecordLockIcon";
import { RecordPrintLink } from "./RecordPrintLink";

interface RecordsTableProps {
  records: RecordSummaryResponse[];
  /** Columna "Autor": solo para ADMIN (ve las historias de todos). */
  showAuthor: boolean;
}

export function RecordsTable({ records, showAuthor }: RecordsTableProps) {
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
          {showAuthor ? <TableHead>Autor</TableHead> : null}
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
              <Link to={recordPath(record.id)} className="font-medium text-primary underline-offset-4 hover:underline">
                {record.patientName}
              </Link>
            </TableCell>
            <TableCell className="whitespace-nowrap">{formatDocument(record.documentType, record.documentNumber)}</TableCell>
            <TableCell>{record.treatingDentist ?? ""}</TableCell>
            <TableCell className="whitespace-nowrap">{formatDate(record.treatmentStartDate)}</TableCell>
            <TableCell className="whitespace-nowrap">{formatDateTime(record.updatedAt)}</TableCell>
            {showAuthor ? <TableCell>{record.authorName}</TableCell> : null}
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <RecordEditLink id={record.id} recordNumber={record.recordNumber} />
                <RecordPrintLink id={record.id} recordNumber={record.recordNumber} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
