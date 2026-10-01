import { Button } from "@/modules/core/ui/button";

interface RecordsPaginationProps {
  page: number;
  totalPages: number;
  last: boolean;
  /** Mientras llega la página pedida se muestra la anterior: los controles no se pulsan dos veces. */
  loading: boolean;
  onChange: (page: number) => void;
}

export function RecordsPagination({ page, totalPages, last, loading, onChange }: RecordsPaginationProps) {
  return (
    <nav aria-label="Paginación de historias" className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Página {page + 1} de {Math.max(totalPages, 1)}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page === 0 || loading} onClick={() => onChange(page - 1)}>
          Anterior
        </Button>
        <Button variant="outline" size="sm" disabled={last || loading} onClick={() => onChange(page + 1)}>
          Siguiente
        </Button>
      </div>
    </nav>
  );
}
