import { useQuery } from "@tanstack/react-query";
import { getRecordQuota } from "@/modules/core/services/generated/orthodontic-records";
import { recordKeys } from "./recordKeys";

/** Cupo de historias del usuario autenticado (`limit` nulo = sin límite) y cuántas creó. */
export function useRecordQuota(enabled = true) {
  return useQuery({ queryKey: recordKeys.quota(), queryFn: () => getRecordQuota(), enabled });
}
