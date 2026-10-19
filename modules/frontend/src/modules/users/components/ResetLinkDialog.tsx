import { Copy } from "lucide-react";
import { Button } from "@/modules/core/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/modules/core/ui/dialog";
import { copyToClipboard } from "@/modules/core/utils/clipboard";
import { passwordResetPath } from "@/routes/paths";

export interface ResetLink {
  fullName: string;
  token: string;
  expiresAt: string;
}

interface ResetLinkDialogProps {
  /** Enlace recién generado; `null` = cerrado (al cerrar no se vuelve a mostrar). */
  link: ResetLink | null;
  onClose: () => void;
}

/**
 * Enlace de restablecimiento para enviar a la persona: el token va en el fragmento (`#`), que el
 * navegador no manda al servidor ni deja en los logs. Solo se muestra esta vez.
 */
export function ResetLinkDialog({ link, onClose }: ResetLinkDialogProps) {
  const url = link ? `${window.location.origin}${passwordResetPath(link.token)}` : "";
  const expires = link
    ? new Date(link.expiresAt).toLocaleString("es-PE", { dateStyle: "medium", timeStyle: "short" })
    : "";
  return (
    <Dialog open={link !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enlace para {link?.fullName}</DialogTitle>
          <DialogDescription>
            Envíaselo por WhatsApp o correo. Sirve una vez y vence el {expires}. Al cerrar este diálogo no se vuelve a
            mostrar.
          </DialogDescription>
        </DialogHeader>
        <p
          className="rounded-md border border-border bg-muted px-3 py-2 font-mono text-xs break-all select-all"
          aria-label="Enlace de restablecimiento"
        >
          {url}
        </p>
        <DialogFooter>
          <Button type="button" onClick={() => void copyToClipboard(url, "Enlace copiado")}>
            <Copy className="size-4" aria-hidden="true" /> Copiar enlace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
