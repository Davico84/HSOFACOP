import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard } from "@/modules/core/services/generated/dashboard";
import { dashboardKeys } from "./dashboardKeys";

/** Métricas globales (solo ADMIN). */
export function useAdminDashboard(enabled: boolean) {
  return useQuery({ queryKey: dashboardKeys.admin(), queryFn: () => getAdminDashboard(), enabled });
}
