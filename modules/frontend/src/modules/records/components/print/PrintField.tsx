import type { ReactNode } from "react";
import { cn } from "@/modules/core/utils/cn";
import { ROW_LEADING, ROW_MIN } from "./printStyle";

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
    <span className={cn("flex min-w-0 items-end gap-[3pt]", ROW_MIN, ROW_LEADING, className)} style={{ flexGrow: grow }}>
      {label ? <span className="shrink-0">{label}</span> : null}
      <span className={cn("min-w-[12mm] flex-1 border-b border-foreground px-[2pt] wrap-break-word", ROW_LEADING)}>{text}</span>
    </span>
  );
}
