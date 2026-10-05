import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card } from "@/modules/core/ui/card";
import type { DashboardResumeItem } from "@/modules/core/services/generated/model";
import { recordPath } from "@/routes/paths";
import { formatDateTime } from "@/modules/records/utils/recordDisplay";

interface ResumeListProps {
  items: DashboardResumeItem[];
}

/** "Para retomar": historias no completas más recientes, cada una abre en su último paso. */
export function ResumeList({ items }: ResumeListProps) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="font-semibold">Para retomar</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tienes historias pendientes: todas tienen los 7 pasos clínicos.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {items.map((item) => {
            const step = item.lastStep ?? 1;
            return (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {item.recordNumber} · {item.patientName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.filledSteps == null ? "Sin calcular" : `${item.filledSteps} de 7 pasos con datos`} ·{" "}
                    {formatDateTime(item.updatedAt)}
                  </p>
                </div>
                <Link
                  to={recordPath(item.id, step)}
                  aria-label={`Retomar historia ${item.recordNumber} en el paso ${step}`}
                  className="inline-flex items-center gap-1 rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Paso {step} <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
