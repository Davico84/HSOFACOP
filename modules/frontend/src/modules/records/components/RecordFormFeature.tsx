import { useState } from "react";
import { useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { useRecord } from "../hooks/useRecord";
import { RecordForm } from "./RecordForm";
import { RecordLoading } from "./RecordLoading";
import { RecordLoadError } from "./RecordLoadError";
import { RecordNotFound } from "./RecordNotFound";

/** Historia nueva (sin `:id`) o existente: carga la historia y monta el formulario. */
export function RecordFormFeature() {
  const { id: param } = useParams();
  const id = param && /^\d+$/.test(param) ? Number(param) : null;
  const isNew = param === undefined;
  const record = useRecord(id);
  // Cambia al recargar tras un 409: remonta el formulario con la versión del servidor.
  const [generation, setGeneration] = useState(0);

  if (isNew) return <RecordForm key="new" record={null} />;
  if (id === null) return <RecordNotFound />;
  if (record.isPending) return <RecordLoading />;
  if (record.isError) {
    return record.error instanceof AxiosError && record.error.response?.status === 404 ? (
      <RecordNotFound />
    ) : (
      <RecordLoadError error={record.error} onRetry={() => void record.refetch()} />
    );
  }
  const reload = async () => {
    const fresh = await record.refetch({ throwOnError: true });
    if (fresh.data) setGeneration((g) => g + 1);
  };
  return <RecordForm key={`${record.data.id}-${generation}`} record={record.data} onReload={reload} />;
}
