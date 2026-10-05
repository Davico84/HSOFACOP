import { FieldHint } from "@/modules/core/components/form/FieldHint";
import { useRecordQuota } from "../hooks/useRecordQuota";
import { quotaReachedMessage, quotaUsage } from "../utils/quota";

/**
 * Uso del cupo del tratante ("3 de 5 historias") y, si lo llenó, el aviso visible. Sin cupo (o para
 * un ADMIN) no muestra nada.
 */
export function RecordQuotaNotice() {
  const { data } = useRecordQuota();
  if (!data || data.limit == null) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">{quotaUsage(data.used, data.limit)}</p>
      {data.reached ? <FieldHint>{quotaReachedMessage(data.limit)}</FieldHint> : null}
    </div>
  );
}
