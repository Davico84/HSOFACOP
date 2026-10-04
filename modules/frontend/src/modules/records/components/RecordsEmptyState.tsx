import { ClipboardList } from "lucide-react";
import { Button } from "@/modules/core/ui/button";
import { NewRecordLink } from "./NewRecordLink";

interface RecordsEmptyStateProps {
  /** Hay una búsqueda activa sin resultados. */
  searching: boolean;
  onClear: () => void;
  /** Si no es la primera página, ofrece volver a la anterior (la página quedó vacía). */
  onBack?: () => void;
}

export function RecordsEmptyState({ searching, onClear, onBack }: RecordsEmptyStateProps) {
  if (searching) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-muted-foreground">No hay historias que coincidan.</p>
        <Button variant="outline" size="sm" onClick={onClear}>
          Limpiar búsqueda
        </Button>
      </div>
    );
  }
  if (onBack) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-muted-foreground">Esta página ya no tiene historias.</p>
        <Button variant="outline" size="sm" onClick={onBack}>
          Volver a la página anterior
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <ClipboardList className="size-10 text-muted-foreground" aria-hidden="true" />
      <p className="text-muted-foreground">Todavía no hay historias clínicas.</p>
      <NewRecordLink />
    </div>
  );
}
