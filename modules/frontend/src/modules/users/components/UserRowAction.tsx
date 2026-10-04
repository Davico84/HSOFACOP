import { Button } from "@/modules/core/ui/button";
import type { UserSummaryResponse } from "@/modules/core/services/generated/model";

interface UserRowActionProps {
  user: UserSummaryResponse;
  pending: boolean;
  quotaPending: boolean;
  onRequestChange: (user: UserSummaryResponse) => void;
  onRequestQuota: (user: UserSummaryResponse) => void;
}

/** Acciones de una fila (cupo y estado): solo cuentas USER (las ADMIN no se gestionan aquí). */
export function UserRowAction({ user, pending, quotaPending, onRequestChange, onRequestQuota }: UserRowActionProps) {
  if (user.role !== "USER") return null;
  const disabling = user.status === "ACTIVE";
  const verb = disabling ? "Deshabilitar" : "Activar";
  return (
    <div className="flex justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={quotaPending}
        onClick={() => onRequestQuota(user)}
        aria-label={`Cambiar el cupo de historias de ${user.fullName}`}
      >
        Cupo
      </Button>
      <Button
        variant={disabling ? "outline" : "secondary"}
        size="sm"
        disabled={pending}
        onClick={() => onRequestChange(user)}
        aria-label={`${verb} la cuenta de ${user.fullName}`}
      >
        {verb}
      </Button>
    </div>
  );
}
