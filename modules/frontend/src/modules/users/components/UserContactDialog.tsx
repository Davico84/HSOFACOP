import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/modules/core/ui/dialog";
import type { UserSummaryResponse } from "@/modules/core/services/generated/model";
import { formatDocument } from "@/modules/records/utils/recordDisplay";

interface UserContactDialogProps {
  /** Cuenta cuyos datos se muestran; `null` = cerrado. */
  user: UserSummaryResponse | null;
  onClose: () => void;
}

const MISSING = "Sin registrar";

/** Datos de contacto e identificación de una cuenta, de solo lectura (los edita la propia cuenta en "Mis datos"). */
export function UserContactDialog({ user, onClose }: UserContactDialogProps) {
  const rows: [string, string][] = user
    ? [
        ["Correo", user.email],
        ["Celular", user.phone || MISSING],
        ["Documento", formatDocument(user.documentType ?? null, user.documentNumber ?? null) || MISSING],
        ["COP", user.copNumber || MISSING],
      ]
    : [];
  return (
    <Dialog open={user !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Datos de {user?.fullName}</DialogTitle>
          <DialogDescription>Los completa la propia cuenta en "Mis datos".</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className={value === MISSING ? "text-muted-foreground italic" : "font-medium break-all"}>{value}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
