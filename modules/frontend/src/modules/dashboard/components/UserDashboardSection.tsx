import { useMyDashboard } from "../hooks/useMyDashboard";
import { DashboardError } from "./DashboardError";
import { DashboardLoading } from "./DashboardLoading";
import { UserDashboard } from "./UserDashboard";

/** Carga las métricas del tratante y muestra carga, error o el dashboard. */
export function UserDashboardSection() {
  const query = useMyDashboard(true);
  if (query.isPending) return <DashboardLoading />;
  if (query.isError) return <DashboardError error={query.error} onRetry={() => void query.refetch()} />;
  return <UserDashboard data={query.data} />;
}
