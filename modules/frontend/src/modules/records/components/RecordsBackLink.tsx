import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useRecordsListUrl } from "../hooks/useRecordsListUrl";

/**
 * "← Historias clínicas" sobre el título de la historia: vuelve al listado con su búsqueda y
 * página. Con cambios sin guardar, `useLeaveGuard` pide confirmación como en cualquier salida.
 */
export function RecordsBackLink() {
  const to = useRecordsListUrl();
  return (
    <Link
      to={to}
      className="inline-flex w-fit items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ArrowLeft className="size-4" aria-hidden="true" /> Historias clínicas
    </Link>
  );
}
