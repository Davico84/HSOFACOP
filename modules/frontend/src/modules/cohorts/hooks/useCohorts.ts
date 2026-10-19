import { useQuery } from "@tanstack/react-query";
import { listCohorts } from "@/modules/core/services/generated/cohorts";
import { cohortKeys } from "./cohortKeys";

/** Turmas por nombre: el ADMIN recibe todas con sus conteos; la coordinación, solo las suyas. */
export function useCohorts(enabled = true) {
  return useQuery({ queryKey: cohortKeys.list(), queryFn: () => listCohorts(), enabled });
}
