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

interface UnlockPatientDialogProps {
  open: boolean;
  recordNumber: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmación del ADMIN antes de desbloquear los datos del paciente. */
export function UnlockPatientDialog({ open, recordNumber, onConfirm, onCancel }: UnlockPatientDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Desbloquear los datos del paciente de la historia {recordNumber}?</AlertDialogTitle>
          <AlertDialogDescription>
            El tratante podrá corregir el nombre, el documento, la fecha y el lugar de nacimiento y el sexo. Se
            vuelven a fijar en la próxima impresión. Queda registrado quién desbloqueó y cuándo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Desbloquear</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
