import { Card } from "@/modules/core/ui/card";
import { MeterBar } from "@/modules/core/components/MeterBar";
import type { DashboardTopAuthor } from "@/modules/core/services/generated/model";
import { formatAverage, historias } from "../utils/format";

interface TopAuthorsListProps {
  authors: DashboardTopAuthor[];
}

/** Tratantes con más historias (las deshabilitadas marcadas) y su promedio de pasos con datos. */
export function TopAuthorsList({ authors }: TopAuthorsListProps) {
  const max = Math.max(...authors.map((a) => a.records), 1);
  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="font-semibold">Tratantes con más historias</h2>
      {authors.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay historias de tratantes.</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {authors.map((a) => (
            <li key={a.userId} className="flex flex-col gap-1">
              <MeterBar
                label={a.status === "DISABLED" ? `${a.fullName} (deshabilitada)` : a.fullName}
                value={a.records}
                max={max}
                valueText={historias(a.records)}
              />
              <p className="text-xs text-muted-foreground">
                {a.averageFilledSteps == null
                  ? "Promedio: sin calcular"
                  : `Promedio: ${formatAverage(a.averageFilledSteps)} de 7 pasos con datos`}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
