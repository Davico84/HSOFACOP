import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listRecords } from "@/modules/core/services/generated/orthodontic-records";
import { RECORDS_PAGE_SIZE, recordKeys } from "./recordKeys";

/**
 * Página del listado de historias (USER: las suyas; ADMIN: todas; COORDINATOR: las de sus turmas).
 * `q` busca sin tildes; `cohortId` filtra la coordinación por una de sus turmas.
 */
export function useRecords(q: string, page: number, cohortId: number | null = null) {
  const params = { q: q.trim(), page, size: RECORDS_PAGE_SIZE, cohortId };
  return useQuery({
    queryKey: recordKeys.list(params),
    queryFn: () => listRecords({ ...params, q: params.q || undefined, cohortId: cohortId ?? undefined }),
    placeholderData: keepPreviousData,
  });
}
