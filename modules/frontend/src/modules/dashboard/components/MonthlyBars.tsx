import { Card } from "@/modules/core/ui/card";
import type { DashboardMonthCount } from "@/modules/core/services/generated/model";
import { historias, monthLabel, monthLongLabel } from "../utils/format";

interface MonthlyBarsProps {
  months: DashboardMonthCount[];
}

/** Historias creadas por mes (barras verticales con CSS y el número visible sobre cada una). */
export function MonthlyBars({ months }: MonthlyBarsProps) {
  const max = Math.max(...months.map((m) => m.count), 1);
  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="font-semibold">Historias creadas por mes</h2>
      <ol className="grid h-44 grid-cols-6 items-end gap-2" aria-label="Últimos 6 meses">
        {months.map((m) => (
          <li
            key={m.month}
            className="flex h-full flex-col items-center justify-end gap-1"
            aria-label={`${monthLongLabel(m.month)}: ${historias(m.count)}`}
          >
            <span className="text-xs font-medium tabular-nums" aria-hidden="true">
              {m.count}
            </span>
            <div
              className="w-full max-w-10 rounded-t-md bg-primary"
              style={{ height: `${Math.round((m.count / max) * 100)}%`, minHeight: m.count > 0 ? "4px" : "0" }}
              aria-hidden="true"
            />
            <span className="text-xs text-muted-foreground" aria-hidden="true">
              {monthLabel(m.month)}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
