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

interface ChangeStatusDialogProps {
  /** Cuenta a cambiar; `null` = cerrado. */
  user: UserSummaryResponse | null;
  onConfirm: (user: UserSummaryResponse) => void;
  onCancel: () => void;
}

/** Confirmación antes de deshabilitar o reactivar una cuenta. */
export function ChangeStatusDialog({ user, onConfirm, onCancel }: ChangeStatusDialogProps) {
  const disabling = user?.status === "ACTIVE";
  return (
    <AlertDialog open={user !== null} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {disabling ? "¿Deshabilitar la cuenta de " : "¿Activar la cuenta de "}
            {user?.fullName}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {disabling
              ? "No podrá iniciar sesión y su sesión abierta terminará en unos minutos. Podrás reactivarla cuando quieras."
              : "Podrá volver a iniciar sesión."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant={disabling ? "destructive" : "default"} onClick={() => user && onConfirm(user)}>
            {disabling ? "Deshabilitar" : "Activar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
