import { useLocation } from "react-router-dom";
import { Pencil, Printer } from "lucide-react";
import { Badge } from "@/modules/core/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/modules/core/ui/table";
import { IconLinkAction } from "@/modules/core/components/IconLinkAction";
import type { RecordSummaryResponse } from "@/modules/core/services/generated/model";
import { recordPath, recordPrintPath } from "@/routes/paths";
import { formatDate, formatDateTime, formatDocument } from "../utils/recordDisplay";
import type { RecordsListView } from "../utils/recordsListView";
import { RecordLockIcon } from "./RecordLockIcon";
import { RecordPatientLink } from "./RecordPatientLink";

interface RecordsTableProps {
  records: RecordSummaryResponse[];
  /** "all" (ADMIN) suma la columna Autor; "cohorts" (coordinación) suma Alumno y Turma y es de solo lectura. */
  view: RecordsListView;
}

/**
 * Listado en escritorio: número con candado, paciente con su documento debajo, tratante, fechas,
 * autor o alumno y turma según el rol, y acciones como íconos con tooltip.
 */
export function RecordsTable({ records, view }: RecordsTableProps) {
  const readOnly = view === "cohorts";
  const location = useLocation();
  const returnTo = { returnTo: `${location.pathname}${location.search}` };
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Número</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead>Odontólogo tratante</TableHead>
            <TableHead>Inicio</TableHead>
            <TableHead>Modificada</TableHead>
            {view === "all" ? <TableHead>Autor</TableHead> : null}
            {readOnly ? <TableHead>Alumno</TableHead> : null}
            {readOnly ? <TableHead>Turma</TableHead> : null}
            <TableHead className="pr-4 text-right">
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            const document = formatDocument(record.documentType, record.documentNumber);
            return (
              <TableRow key={record.id}>
                <TableCell className="py-3 pl-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-semibold">
                    {record.recordNumber}
                    {record.patientLocked ? <RecordLockIcon /> : null}
                  </span>
                </TableCell>
                <TableCell className="max-w-72">
                  <RecordPatientLink
                    id={record.id}
                    patientName={record.patientName}
                    readOnly={readOnly}
                    className="block truncate font-medium text-primary underline-offset-4 hover:underline"
                  />
                  <span className="block truncate text-xs text-muted-foreground">{document || "Sin documento"}</span>
                </TableCell>
                <TableCell>{record.treatingDentist ?? ""}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(record.treatmentStartDate) || "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(record.updatedAt)}</TableCell>
                {view === "all" || readOnly ? <TableCell>{record.authorName}</TableCell> : null}
                {readOnly ? (
                  <TableCell>{record.cohortName ? <Badge variant="outline">{record.cohortName}</Badge> : null}</TableCell>
                ) : null}
                <TableCell className="pr-4 text-right">
                  <div className="flex justify-end gap-0.5">
                    {readOnly ? null : (
                      <IconLinkAction
                        icon={Pencil}
                        to={recordPath(record.id)}
                        label="Editar"
                        ariaLabel={`Editar historia ${record.recordNumber}`}
                      />
                    )}
                    <IconLinkAction
                      icon={Printer}
                      to={recordPrintPath(record.id)}
                      state={returnTo}
                      label="Vista previa de impresión"
                      ariaLabel={`Vista previa de impresión de la historia ${record.recordNumber}`}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
