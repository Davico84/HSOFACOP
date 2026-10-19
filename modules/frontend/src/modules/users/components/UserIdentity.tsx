import type { UserSummaryResponse } from "@/modules/core/services/generated/model";
import { TruncatedText } from "@/modules/core/components/TruncatedText";

/** Iniciales del nombre (máximo dos): "Ana Pérez Ruiz" → "AP". */
function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Cuenta en la tabla: iniciales, nombre y correo debajo, cortados con "…" (y tooltip) si no caben. */
export function UserIdentity({ user }: { user: UserSummaryResponse }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
      >
        {initials(user.fullName)}
      </span>
      <div className="w-56 min-w-0">
        <TruncatedText text={user.fullName} className="font-medium" />
        <TruncatedText text={user.email} className="text-xs text-muted-foreground" />
      </div>
    </div>
  );
}
