import { Link, useLocation } from "react-router-dom";
import { Printer } from "lucide-react";
import { buttonVariants } from "@/modules/core/ui/button-variants";
import { recordPrintPath } from "@/routes/paths";

interface RecordPrintLinkProps {
  id: number;
  recordNumber: string;
}

/**
 * Abre la vista preliminar de impresión en la misma pestaña (no se acumulan pestañas) y recuerda
 * de dónde se vino (listado con su búsqueda o paso del formulario) para que "Volver" regrese ahí.
 */
export function RecordPrintLink({ id, recordNumber }: RecordPrintLinkProps) {
  const location = useLocation();
  return (
    <Link
      to={recordPrintPath(id)}
      state={{ returnTo: `${location.pathname}${location.search}` }}
      aria-label={`Vista previa de impresión de la historia ${recordNumber}`}
      className={buttonVariants({ variant: "outline", size: "sm" })}
    >
      <Printer className="size-4" aria-hidden="true" /> Vista previa
    </Link>
  );
}
