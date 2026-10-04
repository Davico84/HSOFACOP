import { Dialog, DialogContent } from "@/modules/core/ui/dialog";
import type { UserSummaryResponse } from "@/modules/core/services/generated/model";
import { RecordQuotaForm } from "./RecordQuotaForm";

export interface RecordQuotaDialogProps {
  /** Cuenta a la que se le cambia el cupo; `null` = cerrado. */
  user: UserSummaryResponse | null;
  onConfirm: (user: UserSummaryResponse, recordQuota: number | null) => void;
  onCancel: () => void;
}

/** Cupo de historias de una cuenta USER: un número (0–9999) o "Sin límite". */
export function RecordQuotaDialog({ user, onConfirm, onCancel }: RecordQuotaDialogProps) {
  return (
    <Dialog open={user !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        {/* `key`: cada apertura empieza con el cupo actual de esa cuenta. */}
        {user ? <RecordQuotaForm key={user.id} user={user} onConfirm={onConfirm} /> : null}
      </DialogContent>
    </Dialog>
  );
}

