import { GraduationCap, ShieldCheck, UserRound, type LucideIcon } from "lucide-react";
import { Badge } from "@/modules/core/ui/badge";
import { roleLabel } from "@/modules/core/auth/roleLabel";
import type { UserSummaryResponseRole } from "@/modules/core/services/generated/model";

const STYLE: Record<UserSummaryResponseRole, { icon: LucideIcon; variant: "default" | "secondary" | "outline" }> = {
  ADMIN: { icon: ShieldCheck, variant: "default" },
  COORDINATOR: { icon: GraduationCap, variant: "secondary" },
  USER: { icon: UserRound, variant: "outline" },
};

/** Rol de la cuenta con su ícono ("Administrador", "Coordinación", "Alumno"). */
export function UserRoleBadge({ role }: { role: UserSummaryResponseRole }) {
  const { icon: Icon, variant } = STYLE[role];
  return (
    <Badge variant={variant}>
      <Icon aria-hidden="true" />
      {roleLabel(role)}
    </Badge>
  );
}
