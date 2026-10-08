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
  // Cambia al recargar tras un 409 o al traer otra versión al volver: remonta el formulario.
  const [generation, setGeneration] = useState(0);
  // "Actualizada con cambios hechos en otro dispositivo": sobrevive al remontaje.
  const [remoteNotice, setRemoteNotice] = useState(false);
  // Al volver, la historia dejó de estar al alcance (404).
  const [gone, setGone] = useState(false);

  if (isNew) return <RecordForm key="new" record={null} />;
  if (id === null || gone) return <RecordNotFound />;
  // Con la historia en caché (p. ej. al volver de la impresión) se espera a la consulta del montaje:
  // el formulario se monta con lo último guardado, no con la copia anterior.
  if (record.isPending || (record.isFetching && !record.isFetchedAfterMount)) return <RecordLoading />;
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
  return (
    <RecordForm
      key={`${record.data.id}-${generation}`}
      record={record.data}
      onReload={reload}
      // La versión nueva ya está en la caché (la escribió la revisión): sin otra consulta.
      onRemoteUpdate={() => {
        setRemoteNotice(true);
        setGeneration((g) => g + 1);
      }}
      onNotFound={() => setGone(true)}
      remoteNotice={remoteNotice}
      onRemoteNoticeSeen={() => setRemoteNotice(false)}
    />
  );
}
