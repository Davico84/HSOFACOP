import { Badge } from "@/modules/core/ui/badge";
import type { UserSummaryResponseStatus } from "@/modules/core/services/generated/model";

const LABEL: Record<UserSummaryResponseStatus, string> = { ACTIVE: "Activa", DISABLED: "Deshabilitada" };

/** Estado de la cuenta (conoce el enum del contrato: vive en el módulo, sobre el Badge de core). */
export function UserStatusBadge({ status }: { status: UserSummaryResponseStatus }) {
  return <Badge variant={status === "ACTIVE" ? "secondary" : "outline"}>{LABEL[status]}</Badge>;
}
