import { Button } from "@/modules/core/ui/button";
import type { UserSummaryResponse } from "@/modules/core/services/generated/model";

/** Acciones que abre una fila (cada una con su diálogo en `UsersFeature`). */
export interface UserRowHandlers {
  onRequestChange: (user: UserSummaryResponse) => void;
  onRequestQuota: (user: UserSummaryResponse) => void;
  onRequestCoordination: (user: UserSummaryResponse) => void;
  onRequestRevert: (user: UserSummaryResponse) => void;
}

interface UserRowActionProps extends UserRowHandlers {
  user: UserSummaryResponse;
  pending: boolean;
  quotaPending: boolean;
  rolePending: boolean;
}

/**
 * Acciones de una fila: un alumno tiene cupo, coordinación y estado; una coordinación, sus turmas,
 * volver a alumno y estado. Las cuentas ADMIN no se gestionan aquí.
 */
export function UserRowAction({
  user,
  pending,
  quotaPending,
  rolePending,
  onRequestChange,
  onRequestQuota,
  onRequestCoordination,
  onRequestRevert,
}: UserRowActionProps) {
  if (user.role === "ADMIN") return null;
  const disabling = user.status === "ACTIVE";
  const verb = disabling ? "Deshabilitar" : "Activar";
  return (
    <div className="flex flex-wrap justify-end gap-2">
      {user.role === "USER" ? (
        <>
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
            variant="outline"
            size="sm"
            disabled={rolePending}
            onClick={() => onRequestCoordination(user)}
            aria-label={`Convertir en coordinación la cuenta de ${user.fullName}`}
          >
            Coordinación
          </Button>
        </>
      ) : (
        <>
          <Button
            variant="outline"
            size="sm"
            disabled={rolePending}
            onClick={() => onRequestCoordination(user)}
            aria-label={`Cambiar las turmas de ${user.fullName}`}
          >
            Turmas
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={rolePending}
            onClick={() => onRequestRevert(user)}
            aria-label={`Volver a alumno la cuenta de ${user.fullName}`}
          >
            A alumno
          </Button>
        </>
      )}
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
