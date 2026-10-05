import { useMutation, useQueryClient } from "@tanstack/react-query";
import { printRecord } from "@/modules/core/services/generated/orthodontic-records";
import { dashboardKeys } from "@/modules/dashboard/hooks/dashboardKeys";
import { recordKeys } from "./recordKeys";

export interface PrintRecordInput {
  id: number;
  /** Pasos con datos de la historia guardada (el servidor los usa si aún no estaban calculados). */
  filledSteps: number[];
}

/**
 * Registra la impresión en el servidor (la primera fija los datos del paciente) y devuelve la fecha y
 * el avance para la marca de las hojas. Actualiza el detalle en caché y el listado (candado).
 */
export function usePrintRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, filledSteps }: PrintRecordInput) => printRecord(id, { filledSteps }),
    onSuccess: (printed) => {
      queryClient.setQueryData(recordKeys.detail(printed.record.id), printed.record);
      void queryClient.invalidateQueries({ queryKey: recordKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
