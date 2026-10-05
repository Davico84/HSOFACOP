import { useSessionStore } from "@/store/useSessionStore";
import { isRecordsListUrl, useRecordsListStore } from "@/store/useRecordsListStore";
import { PATHS } from "@/routes/paths";

/** Destino de "volver al listado": el último listado visto por esta cuenta, o `/historias`. */
export function useRecordsListUrl(): string {
  const userId = useSessionStore((s) => s.user?.id ?? null);
  const listUrl = useRecordsListStore((s) => s.listUrl);
  const owner = useRecordsListStore((s) => s.userId);
  return listUrl && owner === userId && isRecordsListUrl(listUrl) ? listUrl : PATHS.RECORDS;
}
