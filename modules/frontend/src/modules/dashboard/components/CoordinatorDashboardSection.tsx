import { useCoordinatorDashboard } from "../hooks/useCoordinatorDashboard";
import { CohortProgressCard } from "./CohortProgressCard";
import { DashboardError } from "./DashboardError";
import { DashboardLoading } from "./DashboardLoading";

/** Carga el avance de las turmas de la coordinación: una tarjeta por turma. */
export function CoordinatorDashboardSection() {
  const query = useCoordinatorDashboard();
  if (query.isPending) return <DashboardLoading />;
  if (query.isError) return <DashboardError error={query.error} onRetry={() => void query.refetch()} />;
  if (query.data.cohorts.length === 0) {
    return <p className="text-muted-foreground">Aún no tienes turmas asignadas. Pide al administrador que te las asigne.</p>;
  }
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      {query.data.cohorts.map((cohort) => (
        <CohortProgressCard key={cohort.id} cohort={cohort} />
      ))}
    </div>
  );
}
