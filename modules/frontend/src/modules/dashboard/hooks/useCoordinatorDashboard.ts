import { useQuery } from "@tanstack/react-query";
import { getCoordinatorDashboard } from "@/modules/core/services/generated/dashboard";
import { dashboardKeys } from "./dashboardKeys";

/** Avance de las turmas de la coordinación autenticada. */
export function useCoordinatorDashboard() {
  return useQuery({ queryKey: dashboardKeys.coordinator(), queryFn: () => getCoordinatorDashboard() });
}
