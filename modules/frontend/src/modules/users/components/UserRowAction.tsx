import { Button } from "@/modules/core/ui/button";
import type { UserSummaryResponse } from "@/modules/core/services/generated/model";

interface UserRowActionProps {
  user: UserSummaryResponse;
  pending: boolean;
  onRequestChange: (user: UserSummaryResponse) => void;
}

/** Acción de estado de una fila: solo cuentas USER (las ADMIN no se gestionan aquí). */
export function UserRowAction({ user, pending, onRequestChange }: UserRowActionProps) {
  if (user.role !== "USER") return null;
  const disabling = user.status === "ACTIVE";
  const verb = disabling ? "Deshabilitar" : "Activar";
  return (
    <Button
      variant={disabling ? "outline" : "secondary"}
      size="sm"
      disabled={pending}
      onClick={() => onRequestChange(user)}
      aria-label={`${verb} la cuenta de ${user.fullName}`}
    >
      {verb}
    </Button>
  );
}
