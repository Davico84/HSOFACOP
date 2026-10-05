import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { buttonVariants } from "@/modules/core/ui/button-variants";
import { recordPath } from "@/routes/paths";

interface RecordEditLinkProps {
  id: number;
  recordNumber: string;
}

/** Abre la historia en el formulario de 8 pasos, en el último paso trabajado. */
export function RecordEditLink({ id, recordNumber }: RecordEditLinkProps) {
  return (
    <Link
      to={recordPath(id)}
      aria-label={`Editar historia ${recordNumber}`}
      className={buttonVariants({ variant: "outline", size: "sm" })}
    >
      <Pencil className="size-4" aria-hidden="true" /> Editar
    </Link>
  );
}
