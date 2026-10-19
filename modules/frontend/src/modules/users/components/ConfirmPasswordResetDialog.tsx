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

interface ConfirmPasswordResetDialogProps {
  /** Cuenta para la que se generará el enlace; `null` = cerrado. */
  user: UserSummaryResponse | null;
  onConfirm: (user: UserSummaryResponse) => void;
  onCancel: () => void;
}

/** Confirmación antes de generar un enlace de restablecimiento (anula el anterior sin usar). */
export function ConfirmPasswordResetDialog({ user, onConfirm, onCancel }: ConfirmPasswordResetDialogProps) {
  return (
    <AlertDialog open={user !== null} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Restablecer la contraseña de {user?.fullName}?</AlertDialogTitle>
          <AlertDialogDescription>
            Se genera un enlace de un solo uso que vence en 24 horas para que elija una contraseña nueva. Si ya
            tenía un enlace sin usar, deja de servir.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => user && onConfirm(user)}>Generar enlace</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
