import { Link, useLocation } from "react-router-dom";
import { recordPath, recordPrintPath } from "@/routes/paths";
import { TruncatedText } from "@/modules/core/components/TruncatedText";

interface RecordPatientLinkProps {
  id: number;
  patientName: string;
  /** Solo lectura (coordinación): abre la vista preliminar y recuerda el listado para "Volver". */
  readOnly: boolean;
  className?: string;
  /** En la tabla: una línea cortada con "…" (texto completo en un tooltip); en las tarjetas se ajusta. */
  truncate?: boolean;
}

/** Nombre del paciente que abre la historia: el formulario para quien la edita, la vista preliminar si no. */
export function RecordPatientLink({ id, patientName, readOnly, className, truncate = false }: RecordPatientLinkProps) {
  const label = truncate ? <TruncatedText text={patientName} /> : patientName;
  const location = useLocation();
  if (readOnly) {
    return (
      <Link
        to={recordPrintPath(id)}
        state={{ returnTo: `${location.pathname}${location.search}` }}
        className={className}
      >
        {label}
      </Link>
    );
  }
  return (
    <Link to={recordPath(id)} className={className}>
      {label}
    </Link>
  );
}
