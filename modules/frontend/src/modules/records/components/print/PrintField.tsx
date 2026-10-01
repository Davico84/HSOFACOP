import type { ReactNode } from "react";
import { cn } from "@/modules/core/utils/cn";

interface PrintFieldProps {
  label: ReactNode;
  value?: string | number | null;
  /** Ancho relativo de la línea (como en el PDF). */
  grow?: number;
  className?: string;
}

/** "Etiqueta ____": el valor escrito sobre la línea, o la línea en blanco para llenar a mano. */
export function PrintField({ label, value, grow = 1, className }: PrintFieldProps) {
  const text = value === null || value === undefined ? "" : String(value);
  return (
    <span className={cn("flex min-w-0 items-end gap-1", className)} style={{ flexGrow: grow }}>
      <span className="shrink-0">{label}</span>
      <span className="min-h-[1.2em] min-w-12 flex-1 border-b border-foreground px-1 wrap-break-word">{text}</span>
    </span>
  );
}
