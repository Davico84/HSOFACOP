import { useQuery } from "@tanstack/react-query";
import { getMyDashboard } from "@/modules/core/services/generated/dashboard";
import { dashboardKeys } from "./dashboardKeys";

/** Métricas del tratante autenticado (solo sus historias). */
export function useMyDashboard(enabled: boolean) {
  return useQuery({ queryKey: dashboardKeys.me(), queryFn: () => getMyDashboard(), enabled });
}
