import { Badge } from "@/modules/core/ui/badge";
import { cn } from "@/modules/core/utils/cn";
import type { UserSummaryResponseStatus } from "@/modules/core/services/generated/model";

const LABEL: Record<UserSummaryResponseStatus, string> = { ACTIVE: "Activa", DISABLED: "Deshabilitada" };

/** Estado de la cuenta con un punto de color (conoce el enum del contrato: vive en el módulo, sobre el Badge de core). */
export function UserStatusBadge({ status }: { status: UserSummaryResponseStatus }) {
  const active = status === "ACTIVE";
  return (
    <Badge variant="outline" className={active ? "border-success/30 bg-success/10" : "text-muted-foreground"}>
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", active ? "bg-success" : "bg-muted-foreground")} />
      {LABEL[status]}
    </Badge>
  );
}
