import { useAdminDashboard } from "../hooks/useAdminDashboard";
import { AdminDashboard } from "./AdminDashboard";
import { DashboardError } from "./DashboardError";
import { DashboardLoading } from "./DashboardLoading";

/** Carga las métricas globales y muestra carga, error o el dashboard. */
export function AdminDashboardSection() {
  const query = useAdminDashboard(true);
  if (query.isPending) return <DashboardLoading />;
  if (query.isError) return <DashboardError error={query.error} onRetry={() => void query.refetch()} />;
  return <AdminDashboard data={query.data} />;
}
