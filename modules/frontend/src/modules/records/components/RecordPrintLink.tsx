import { Link } from "react-router-dom";
import { Printer } from "lucide-react";
import { buttonVariants } from "@/modules/core/ui/button-variants";
import { recordPrintPath } from "@/routes/paths";

interface RecordPrintLinkProps {
  id: number;
  recordNumber: string;
}

/** Abre la vista preliminar de impresión en otra pestaña (el formulario queda abierto); allí se imprime. */
export function RecordPrintLink({ id, recordNumber }: RecordPrintLinkProps) {
  return (
    <Link
      to={recordPrintPath(id)}
      target="_blank"
      rel="noopener"
      aria-label={`Vista previa de impresión de la historia ${recordNumber}`}
      className={buttonVariants({ variant: "outline", size: "sm" })}
    >
      <Printer className="size-4" aria-hidden="true" /> Vista previa
    </Link>
  );
}
