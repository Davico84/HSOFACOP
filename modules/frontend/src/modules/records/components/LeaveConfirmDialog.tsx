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

interface LeaveConfirmDialogProps {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}

/** Salir de la historia con cambios sin guardar: confirmar antes de descartarlos. */
export function LeaveConfirmDialog({ open, onStay, onLeave }: LeaveConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onStay()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Salir sin guardar?</AlertDialogTitle>
          <AlertDialogDescription>
            Tienes cambios sin guardar en esta historia. Si sales, se perderán.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Seguir editando</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onLeave}>
            Salir sin guardar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
