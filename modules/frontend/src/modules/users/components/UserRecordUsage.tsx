import type { UserSummaryResponse } from "@/modules/core/services/generated/model";
import { cn } from "@/modules/core/utils/cn";
import { recordUsage } from "../utils/quota";

/** Historias creadas y cupo; con cupo, una barra corta del uso (llena = en el tope). */
export function UserRecordUsage({ user }: { user: UserSummaryResponse }) {
  const limited = user.role === "USER" && user.recordQuota != null;
  const full = limited && user.recordCount >= (user.recordQuota ?? 0);
  const percent = limited ? Math.min(100, Math.round((user.recordCount / Math.max(user.recordQuota ?? 0, 1)) * 100)) : 0;
  return (
    <div className="flex w-28 flex-col gap-1">
      <span className={cn("text-sm tabular-nums", user.role !== "USER" && "text-muted-foreground")}>{recordUsage(user)}</span>
      {limited ? (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <div className={cn("h-full rounded-full", full ? "bg-warning" : "bg-primary")} style={{ width: `${full ? 100 : percent}%` }} />
        </div>
      ) : null}
    </div>
  );
}
