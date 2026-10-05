import { CheckCircle2, ClipboardList, UserPlus, Users } from "lucide-react";
import { StatCard } from "@/modules/core/components/StatCard";
import type { AdminDashboardResponse } from "@/modules/core/services/generated/model";
import { historias } from "../utils/format";
import { MonthlyBars } from "./MonthlyBars";
import { QuotaAlerts } from "./QuotaAlerts";
import { TopAuthorsList } from "./TopAuthorsList";
import { UnlockRequestsList } from "./UnlockRequestsList";

interface AdminDashboardProps {
  data: AdminDashboardResponse;
}

/** Inicio del ADMIN: solo métricas globales (cuentas, historias, tratantes y cupos). */
export function AdminDashboard({ data }: AdminDashboardProps) {
  const { users, records, topAuthors, quotas, unlockRequests } = data;
  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="kpis-title" className="flex flex-col gap-2">
        <h2 id="kpis-title" className="sr-only">
          Indicadores
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <StatCard
            label="Cuentas"
            value={String(users.total)}
            hint={`${users.active} activas · ${users.disabled} deshabilitadas`}
            icon={Users}
          />
          <StatCard label="Cuentas nuevas" value={String(users.newThisMonth)} hint="Este mes" icon={UserPlus} />
          <StatCard
            label="Historias"
            value={String(records.total)}
            hint={`${records.createdThisMonth} creadas este mes`}
            icon={ClipboardList}
          />
          <StatCard
            label="Completas"
            value={String(records.complete)}
            hint={`${records.inProgress} en progreso`}
            icon={CheckCircle2}
          />
        </div>
        {records.notComputed > 0 ? (
          <p className="text-sm text-muted-foreground">
            {historias(records.notComputed)} sin calcular: se calculan al volver a guardarlas.
          </p>
        ) : null}
      </section>
      <UnlockRequestsList requests={unlockRequests} />
      <MonthlyBars months={records.perMonth} />
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <TopAuthorsList authors={topAuthors} />
        <QuotaAlerts quotas={quotas} />
      </div>
    </div>
  );
}
