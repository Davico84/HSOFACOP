import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/modules/core/ui/button";
import type { RecordResponse } from "@/modules/core/services/generated/model";
import { useSessionStore } from "@/store/useSessionStore";
import {
  useDiscardPatientUnlockRequest,
  useRequestPatientUnlock,
  useUnlockPatient,
} from "../hooks/usePatientLock";
import { formatInstantDate } from "../utils/patientLock";
import { RequestUnlockDialog } from "./RequestUnlockDialog";
import { UnlockPatientDialog } from "./UnlockPatientDialog";

interface PatientLockNoticeProps {
  record: RecordResponse;
}

/**
 * Datos del paciente fijos tras imprimir: qué está fijo y desde cuándo, el último desbloqueo y las
 * acciones (el tratante solicita el desbloqueo; el ADMIN desbloquea o descarta la solicitud).
 */
export function PatientLockNotice({ record }: PatientLockNoticeProps) {
  const isAdmin = useSessionStore((s) => s.user?.role === "ADMIN");
  const [requesting, setRequesting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const request = useRequestPatientUnlock(record.id);
  const unlock = useUnlockPatient(record.id);
  const discard = useDiscardPatientUnlockRequest(record.id);
  const pendingRequest = record.unlockRequest;

  if (!record.patientLockedAt) {
    return record.lastUnlock ? (
      <p className="text-sm text-muted-foreground">
        Datos del paciente desbloqueados por {record.lastUnlock.byName} el {formatInstantDate(record.lastUnlock.at)}: se
        vuelven a fijar al imprimir.
      </p>
    ) : null;
  }

  return (
    <section
      aria-label="Datos del paciente fijos"
      className="flex flex-col gap-3 rounded-md border border-border bg-muted/50 p-4 text-sm sm:flex-row sm:items-start"
    >
      <Lock className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="font-medium">Datos del paciente fijos desde el {formatInstantDate(record.patientLockedAt)}</p>
        <p className="text-muted-foreground">
          Al imprimir quedaron fijos el nombre, el documento, la fecha y el lugar de nacimiento y el sexo. El resto de la
          historia se sigue editando.
        </p>
        {record.lastUnlock ? (
          <p className="text-muted-foreground">
            Último desbloqueo: {record.lastUnlock.byName}, el {formatInstantDate(record.lastUnlock.at)}.
          </p>
        ) : null}
        {pendingRequest ? (
          <p>
            Desbloqueo solicitado el {formatInstantDate(pendingRequest.requestedAt)}
            {isAdmin ? <>: «{pendingRequest.reason}»</> : null}.
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {isAdmin ? (
          <>
            <Button type="button" size="sm" disabled={unlock.isPending} onClick={() => setConfirming(true)}>
              Desbloquear datos del paciente
            </Button>
            {pendingRequest ? (
              <Button type="button" size="sm" variant="outline" disabled={discard.isPending} onClick={() => discard.mutate()}>
                Descartar solicitud
              </Button>
            ) : null}
          </>
        ) : pendingRequest ? null : (
          <Button type="button" size="sm" variant="outline" onClick={() => setRequesting(true)}>
            Solicitar desbloqueo
          </Button>
        )}
      </div>
      <RequestUnlockDialog
        open={requesting}
        pending={request.isPending}
        onOpenChange={setRequesting}
        onSubmit={(reason) => request.mutate(reason, { onSuccess: () => setRequesting(false) })}
      />
      <UnlockPatientDialog
        open={confirming}
        recordNumber={record.recordNumber}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          unlock.mutate();
        }}
      />
    </section>
  );
}
