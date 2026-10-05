import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRecord, updateRecord } from "@/modules/core/services/generated/orthodontic-records";
import type { RecordResponse } from "@/modules/core/services/generated/model";
import type { RecordFormValues } from "../schemas/record";
import { toCreateRequest, toUpdateRequest } from "../utils/recordForm";
import { recordKeys } from "./recordKeys";

export interface SaveRecordInput {
  values: RecordFormValues;
  /** Historia ya creada: id y versión cargada. Sin ella, se crea. */
  existing?: { id: number; version: number };
  /** Paso en que se trabajó (se abre ahí al volver); solo al guardar una existente. */
  lastStep?: number;
}

/**
 * Crea o guarda la historia completa. Al terminar bien actualiza el detalle en caché y marca el
 * listado como desactualizado. Los errores (400 por campo, 409 de versión) los decide quien llama.
 */
export function useSaveRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ values, existing, lastStep }: SaveRecordInput): Promise<RecordResponse> =>
      existing
        ? updateRecord(existing.id, toUpdateRequest(values, existing.version, lastStep))
        : createRecord(toCreateRequest(values)),
    onSuccess: (record) => {
      queryClient.setQueryData(recordKeys.detail(record.id), record);
      void queryClient.invalidateQueries({ queryKey: recordKeys.lists() });
      // Crear consume cupo: se vuelve a consultar.
      void queryClient.invalidateQueries({ queryKey: recordKeys.quota() });
    },
  });
}
