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
import type { CohortResponse } from "@/modules/core/services/generated/model";

interface RegenerateCodeDialogProps {
  /** Turma a la que se le genera un código nuevo; `null` = cerrado. */
  cohort: CohortResponse | null;
  onConfirm: (cohort: CohortResponse) => void;
  onCancel: () => void;
}

/** Confirmación antes de generar un código nuevo: el actual deja de servir. */
export function RegenerateCodeDialog({ cohort, onConfirm, onCancel }: RegenerateCodeDialogProps) {
  return (
    <AlertDialog open={cohort !== null} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Generar un código nuevo para {cohort?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            El código actual dejará de servir para registrarse. Los alumnos ya inscritos siguen en la turma.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => cohort && onConfirm(cohort)}>Generar código nuevo</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
