import { Copy } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/modules/core/ui/dialog";
import { IconAction } from "@/modules/core/components/IconAction";
import { copyToClipboard } from "@/modules/core/utils/clipboard";
import type { UserSummaryResponse } from "@/modules/core/services/generated/model";
import { formatDocument } from "@/modules/records/utils/recordDisplay";

interface UserContactDialogProps {
  /** Cuenta cuyos datos se muestran; `null` = cerrado. */
  user: UserSummaryResponse | null;
  onClose: () => void;
}

const MISSING = "Sin registrar";

interface Row {
  label: string;
  value: string | null;
  /** Con valor: se puede copiar (para contactar a la cuenta). */
  copy?: boolean;
}

/**
 * Datos de contacto e identificación de una cuenta, de solo lectura (los edita la propia cuenta en
 * "Mis datos"). El correo y el celular, completos y con "Copiar".
 */
export function UserContactDialog({ user, onClose }: UserContactDialogProps) {
  const rows: Row[] = user
    ? [
        { label: "Correo", value: user.email, copy: true },
        { label: "Celular", value: user.phone || null, copy: true },
        { label: "Documento", value: formatDocument(user.documentType ?? null, user.documentNumber ?? null) || null },
        { label: "COP", value: user.copNumber || null },
      ]
    : [];
  return (
    <Dialog open={user !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Datos de {user?.fullName}</DialogTitle>
          <DialogDescription>Los completa la propia cuenta en "Mis datos".</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 text-sm">
          {rows.map(({ label, value, copy }) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className={value ? "min-w-0 font-medium break-all" : "text-muted-foreground italic"}>{value ?? MISSING}</dd>
              <dd className="flex min-h-8 justify-end">
                {copy && value ? (
                  <IconAction
                    icon={Copy}
                    label={`Copiar ${label.toLowerCase()}`}
                    onClick={() => void copyToClipboard(value, `${label} copiado`)}
                  />
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
