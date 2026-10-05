import { Card } from "@/modules/core/ui/card";
import { Badge } from "@/modules/core/ui/badge";
import type { AdminDashboardQuotas } from "@/modules/core/services/generated/model";

interface QuotaAlertsProps {
  quotas: AdminDashboardQuotas;
}

/** Tratantes con el cupo lleno o al 80 % o más (los 10 más cerca del tope y el total). */
export function QuotaAlerts({ quotas }: QuotaAlertsProps) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">Cupos cerca del tope</h2>
        <span className="text-sm text-muted-foreground">
          {quotas.total} {quotas.total === 1 ? "tratante" : "tratantes"}
        </span>
      </div>
      {quotas.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ningún tratante está cerca de su cupo.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {quotas.items.map((q) => (
            <li key={q.userId} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
              <span className="min-w-0 truncate">{q.fullName}</span>
              <span className="flex shrink-0 items-center gap-2 text-sm tabular-nums">
                {q.used} de {q.limit}
                {q.reached ? <Badge variant="destructive">Lleno</Badge> : null}
              </span>
            </li>
          ))}
        </ul>
      )}
      {quotas.total > quotas.items.length ? (
        <p className="text-xs text-muted-foreground">Se muestran los {quotas.items.length} más cerca del tope.</p>
      ) : null}
    </Card>
  );
}
