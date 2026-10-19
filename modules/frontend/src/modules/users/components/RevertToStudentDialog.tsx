import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/modules/core/ui/alert-dialog";
import type { UserSummaryResponse } from "@/modules/core/services/generated/model";

interface RevertToStudentDialogProps {
  /** Coordinación a volver a alumno; `null` = cerrado. */
  user: UserSummaryResponse | null;
  onConfirm: (user: UserSummaryResponse) => void;
  onCancel: () => void;
}

/** Confirmación antes de volver a alumno una cuenta de coordinación. */
export function RevertToStudentDialog({ user, onConfirm, onCancel }: RevertToStudentDialogProps) {
  return (
    <AlertDialog open={user !== null} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Volver a alumno la cuenta de {user?.fullName}?</AlertDialogTitle>
          <AlertDialogDescription>
            Deja de ver las historias de sus turmas al instante, queda sin turma de alumno y recibe el cupo inicial de
            historias.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => user && onConfirm(user)}>Volver a alumno</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
