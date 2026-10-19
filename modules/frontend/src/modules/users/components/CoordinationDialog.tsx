import { Dialog, DialogContent } from "@/modules/core/ui/dialog";
import type { CohortResponse, UserSummaryResponse } from "@/modules/core/services/generated/model";
import { CoordinationForm } from "./CoordinationForm";

export interface CoordinationDialogProps {
  /** Cuenta a convertir en coordinación o a la que se le cambian las turmas; `null` = cerrado. */
  user: UserSummaryResponse | null;
  cohorts: CohortResponse[];
  onConfirm: (user: UserSummaryResponse, cohortIds: number[]) => void;
  onCancel: () => void;
}

/** Turmas de una coordinación (una o más): convierte a un alumno o cambia las de una coordinación. */
export function CoordinationDialog({ user, cohorts, onConfirm, onCancel }: CoordinationDialogProps) {
  return (
    <Dialog open={user !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        {/* `key`: cada apertura empieza con las turmas actuales de esa cuenta. */}
        {user ? <CoordinationForm key={user.id} user={user} cohorts={cohorts} onConfirm={onConfirm} /> : null}
      </DialogContent>
    </Dialog>
  );
}
