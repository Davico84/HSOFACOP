import { CheckCircle2, ClipboardList, Gauge, ListChecks } from "lucide-react";
import { StatCard } from "@/modules/core/components/StatCard";
import type { UserDashboardResponse } from "@/modules/core/services/generated/model";
import { formatAverage, historias } from "../utils/format";
import { DashboardEmpty } from "./DashboardEmpty";
import { MissingData } from "./MissingData";
import { ResumeList } from "./ResumeList";

interface UserDashboardProps {
  data: UserDashboardResponse;
}

/** Inicio del tratante: sus historias, cupo, completitud, datos faltantes y qué retomar. */
export function UserDashboard({ data }: UserDashboardProps) {
  const { records, quota, completeness, missing, resume } = data;
  if (records.total === 0) return <DashboardEmpty />;
  const computed = completeness.complete + completeness.inProgress;
  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="kpis-title" className="flex flex-col gap-2">
        <h2 id="kpis-title" className="sr-only">
          Indicadores
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard
            label="Historias"
            value={String(records.total)}
            hint={`${records.createdThisMonth} creadas este mes`}
            icon={ClipboardList}
          />
          <StatCard
            label="Cupo"
            value={quota.limit == null ? "Sin límite" : `${quota.used} de ${quota.limit}`}
            hint={quota.reached ? "Llegaste al máximo: no puedes crear más" : undefined}
            icon={Gauge}
          />
          <StatCard
            label="Completas"
            value={String(completeness.complete)}
            hint={`${completeness.inProgress} en progreso`}
            icon={CheckCircle2}
          />
          <StatCard
            label="Promedio de pasos"
            value={formatAverage(completeness.averageFilledSteps)}
            hint="Con datos, de 7 clínicos (Firmas no cuenta)"
            icon={ListChecks}
          />
        </div>
        {completeness.notComputed > 0 ? (
          <p className="text-sm text-muted-foreground">
            {historias(completeness.notComputed)} sin calcular: se calculan al volver a guardarlas.
          </p>
        ) : null}
      </section>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <ResumeList items={resume} />
        <MissingData missing={missing} computed={computed} />
      </div>
    </div>
  );
}
