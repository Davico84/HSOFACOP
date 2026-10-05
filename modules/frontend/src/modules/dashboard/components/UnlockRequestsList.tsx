import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card } from "@/modules/core/ui/card";
import type { AdminDashboardUnlockRequests } from "@/modules/core/services/generated/model";
import { recordPath } from "@/routes/paths";
import { formatInstantDate } from "@/modules/records/utils/patientLock";

interface UnlockRequestsListProps {
  requests: AdminDashboardUnlockRequests;
}

/** Solicitudes de desbloqueo pendientes (más antiguas primero); cada una abre la historia para resolverla. */
export function UnlockRequestsList({ requests }: UnlockRequestsListProps) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">Solicitudes de desbloqueo</h2>
        <span className="text-sm text-muted-foreground">
          {requests.total} {requests.total === 1 ? "solicitud" : "solicitudes"}
        </span>
      </div>
      {requests.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay solicitudes de desbloqueo.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {requests.items.map((r) => (
            <li key={r.recordId} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {r.recordNumber} · {r.patientName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {r.authorName} · {formatInstantDate(r.requestedAt)} · «{r.reason}»
                </p>
              </div>
              <Link
                to={recordPath(r.recordId, 1)}
                aria-label={`Revisar la solicitud de la historia ${r.recordNumber}`}
                className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                Revisar <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {requests.total > requests.items.length ? (
        <p className="text-xs text-muted-foreground">Se muestran las {requests.items.length} más antiguas.</p>
      ) : null}
    </Card>
  );
}
