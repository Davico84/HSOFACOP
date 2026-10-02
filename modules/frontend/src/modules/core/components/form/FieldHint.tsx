import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/modules/core/utils/cn";

interface FieldHintProps {
  /** Para enlazarla al control con `aria-describedby`. */
  id?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Ayuda de un campo o de un bloque: valores de referencia, aclaraciones ("puede ser anterior al
 * inicio del tratamiento"). Siempre visible —no en un tooltip, que en tablet o celular la
 * escondería— y discreta: caja suave con ícono, en el color de texto secundario del tema.
 */
export function FieldHint({ id, children, className }: FieldHintProps) {
  return (
    <div
      id={id}
      className={cn("flex w-fit max-w-full items-start gap-1.5 rounded-md bg-muted/60 px-2 py-1.5 text-xs text-muted-foreground", className)}
    >
      <Info className="mt-px size-3.5 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
