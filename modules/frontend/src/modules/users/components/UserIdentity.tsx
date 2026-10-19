import type { UserSummaryResponse } from "@/modules/core/services/generated/model";

/** Iniciales del nombre (máximo dos): "Ana Pérez Ruiz" → "AP". */
function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Cuenta en la tabla: iniciales, nombre y correo debajo. */
export function UserIdentity({ user }: { user: UserSummaryResponse }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
      >
        {initials(user.fullName)}
      </span>
      <div className="min-w-0">
        <p className="font-medium wrap-break-word">{user.fullName}</p>
        <p className="text-xs break-all text-muted-foreground">{user.email}</p>
      </div>
    </div>
  );
}
