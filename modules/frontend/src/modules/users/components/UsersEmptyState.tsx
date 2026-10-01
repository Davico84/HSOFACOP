import { Button } from "@/modules/core/ui/button";

interface UsersEmptyStateProps {
  /** Si no es la primera página, ofrece volver a la anterior (la página quedó vacía). */
  onBack?: () => void;
}

export function UsersEmptyState({ onBack }: UsersEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <p className="text-muted-foreground">{onBack ? "Esta página ya no tiene cuentas." : "Todavía no hay cuentas."}</p>
      {onBack ? (
        <Button variant="outline" size="sm" onClick={onBack}>
          Volver a la página anterior
        </Button>
      ) : null}
    </div>
  );
}
