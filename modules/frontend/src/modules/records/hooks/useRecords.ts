import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listRecords } from "@/modules/core/services/generated/orthodontic-records";
import { RECORDS_PAGE_SIZE, recordKeys } from "./recordKeys";

/** Página del listado de historias (USER: las suyas; ADMIN: todas). `q` busca sin tildes. */
export function useRecords(q: string, page: number) {
  const params = { q: q.trim(), page, size: RECORDS_PAGE_SIZE };
  return useQuery({
    queryKey: recordKeys.list(params),
    queryFn: () => listRecords({ ...params, q: params.q || undefined }),
    placeholderData: keepPreviousData,
  });
}
