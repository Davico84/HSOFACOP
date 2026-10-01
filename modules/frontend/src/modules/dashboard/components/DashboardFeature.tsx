import { StatCard } from "@/modules/core/components/StatCard";
import { useSessionStore } from "@/store/useSessionStore";
import { sampleActivity, sampleKpis } from "../data/sampleData";
import { RecentActivity } from "./RecentActivity";
import { SampleDataBanner } from "./SampleDataBanner";

/** Dashboard de inicio de la plantilla: saludo, KPIs y actividad (datos de ejemplo). */
export function DashboardFeature() {
  const user = useSessionStore((s) => s.user);
  const name = user?.fullName ?? user?.email;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{name ? `Hola, ${name}` : "Hola"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Resumen general de tu espacio de trabajo.</p>
      </div>

      <SampleDataBanner />

      <section aria-labelledby="kpis-title">
        <h2 id="kpis-title" className="sr-only">
          Indicadores
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {sampleKpis.map((kpi) => (
            <StatCard key={kpi.label} label={kpi.label} value={kpi.value} hint={kpi.hint} icon={kpi.icon} />
          ))}
        </div>
      </section>

      <RecentActivity items={sampleActivity} />
    </div>
  );
}
