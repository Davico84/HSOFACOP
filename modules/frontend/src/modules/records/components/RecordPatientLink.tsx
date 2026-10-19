import { Link, useLocation } from "react-router-dom";
import { recordPath, recordPrintPath } from "@/routes/paths";

interface RecordPatientLinkProps {
  id: number;
  patientName: string;
  /** Solo lectura (coordinación): abre la vista preliminar y recuerda el listado para "Volver". */
  readOnly: boolean;
  className?: string;
}

/** Nombre del paciente que abre la historia: el formulario para quien la edita, la vista preliminar si no. */
export function RecordPatientLink({ id, patientName, readOnly, className }: RecordPatientLinkProps) {
  const location = useLocation();
  if (readOnly) {
    return (
      <Link
        to={recordPrintPath(id)}
        state={{ returnTo: `${location.pathname}${location.search}` }}
        className={className}
      >
        {patientName}
      </Link>
    );
  }
  return (
    <Link to={recordPath(id)} className={className}>
      {patientName}
    </Link>
  );
}
