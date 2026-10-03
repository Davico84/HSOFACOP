import { useQuery } from "@tanstack/react-query";
import { getRecord } from "@/modules/core/services/generated/orthodontic-records";
import { recordKeys } from "./recordKeys";

/** Una historia. Sin reintentos: un 404 (inexistente o ajena) se muestra enseguida. */
export function useRecord(id: number | null) {
  return useQuery({
    queryKey: recordKeys.detail(id ?? 0),
    queryFn: () => getRecord(id as number),
    enabled: id !== null,
    retry: false,
    // El formulario es la copia de trabajo: no se recarga sola mientras se edita.
    refetchOnWindowFocus: false,
  });
}
