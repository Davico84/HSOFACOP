import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listRecords, searchRecords } from "@/modules/core/services/generated/orthodontic-records";
import { RECORDS_PAGE_SIZE, recordKeys } from "./recordKeys";

/**
 * Página del listado de historias (USER: las suyas; ADMIN: todas; COORDINATOR: las de sus turmas).
 * `q` busca sin tildes y viaja en el cuerpo de un `POST` (nunca en la URL); sin texto se usa el
 * listado `GET`. `cohortId` filtra la coordinación por una de sus turmas.
 */
export function useRecords(q: string, page: number, cohortId: number | null = null) {
  const params = { q: q.trim(), page, size: RECORDS_PAGE_SIZE, cohortId };
  return useQuery({
    queryKey: recordKeys.list(params),
    queryFn: () => {
      const { q: text, ...paging } = params;
      const page = { ...paging, cohortId: paging.cohortId ?? undefined };
      return text ? searchRecords({ q: text }, page) : listRecords(page);
    },
    placeholderData: keepPreviousData,
  });
}
