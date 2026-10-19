import { Gauge, GraduationCap, IdCard, Layers, Undo2, UserCheck, UserX } from "lucide-react";
import { IconAction } from "@/modules/core/components/IconAction";
import type { UserSummaryResponse } from "@/modules/core/services/generated/model";

/** Acciones que abre una fila (cada una con su diálogo en `UsersFeature`). */
export interface UserRowHandlers {
  onRequestChange: (user: UserSummaryResponse) => void;
  onRequestQuota: (user: UserSummaryResponse) => void;
  onRequestCoordination: (user: UserSummaryResponse) => void;
  onRequestRevert: (user: UserSummaryResponse) => void;
  onRequestContact: (user: UserSummaryResponse) => void;
}

interface UserRowActionProps extends UserRowHandlers {
  user: UserSummaryResponse;
  pending: boolean;
  quotaPending: boolean;
  rolePending: boolean;
}

/**
 * Acciones de una fila, como íconos con tooltip: toda cuenta tiene "Ver datos"; un alumno, además,
 * cupo, coordinación y estado; una coordinación, sus turmas, volver a alumno y estado. Las cuentas
 * ADMIN no se gestionan aquí (solo se ven sus datos).
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
  onRequestContact,
}: UserRowActionProps) {
  const disabling = user.status === "ACTIVE";
  const name = user.fullName;
  const contact = (
    <IconAction
      icon={IdCard}
      label="Ver datos"
      ariaLabel={`Ver los datos de ${name}`}
      onClick={() => onRequestContact(user)}
    />
  );
  if (user.role === "ADMIN") return <div className="flex justify-end">{contact}</div>;
  return (
    <div className="flex justify-end gap-0.5">
      {contact}
      {user.role === "USER" ? (
        <>
          <IconAction
            icon={Gauge}
            label="Cupo de historias"
            ariaLabel={`Cambiar el cupo de historias de ${name}`}
            loading={quotaPending}
            onClick={() => onRequestQuota(user)}
          />
          <IconAction
            icon={GraduationCap}
            label="Convertir en coordinación"
            ariaLabel={`Convertir en coordinación la cuenta de ${name}`}
            loading={rolePending}
            onClick={() => onRequestCoordination(user)}
          />
        </>
      ) : (
        <>
          <IconAction
            icon={Layers}
            label="Turmas que coordina"
            ariaLabel={`Cambiar las turmas de ${name}`}
            loading={rolePending}
            onClick={() => onRequestCoordination(user)}
          />
          <IconAction
            icon={Undo2}
            label="Volver a alumno"
            ariaLabel={`Volver a alumno la cuenta de ${name}`}
            disabled={rolePending}
            onClick={() => onRequestRevert(user)}
          />
        </>
      )}
      <IconAction
        icon={disabling ? UserX : UserCheck}
        label={disabling ? "Deshabilitar cuenta" : "Activar cuenta"}
        ariaLabel={`${disabling ? "Deshabilitar" : "Activar"} la cuenta de ${name}`}
        tone={disabling ? "danger" : "default"}
        loading={pending}
        onClick={() => onRequestChange(user)}
      />
    </div>
  );
}
