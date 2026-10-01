import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listUsers } from "@/modules/core/services/generated/users";
import { USERS_PAGE_SIZE, userKeys } from "./userKeys";

/**
 * Página del listado de cuentas (solo ADMIN). `keepPreviousData`: al cambiar de página la
 * tabla anterior sigue visible mientras llega la nueva (`isPlaceholderData`).
 */
export function useUsers(page: number) {
  const params = { page, size: USERS_PAGE_SIZE };
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => listUsers(params),
    placeholderData: keepPreviousData,
  });
}
