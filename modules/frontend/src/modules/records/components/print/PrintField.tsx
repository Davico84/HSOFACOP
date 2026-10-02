import type { ReactNode } from "react";
import { cn } from "@/modules/core/utils/cn";
import { ROW_LEADING, ROW_MIN } from "./printStyle";

interface PrintFieldProps {
  label: ReactNode;
  value?: string | number | null;
  /** Ancho relativo de la línea (como en el PDF). */
  grow?: number;
  className?: string;
  /** Se llena a mano sobre el papel (firma, fecha): lleva la raya para escribir. */
  handwritten?: boolean;
}

/**
 * "Etiqueta valor": el dato sale impreso como texto, sin raya (las rayas eran para escribir a
 * mano). Solo los campos que se llenan sobre el papel (`handwritten`: firma, fecha) llevan raya.
 */
export function PrintField({ label, value, grow = 1, className, handwritten = false }: PrintFieldProps) {
  const text = value === null || value === undefined ? "" : String(value);
  return (
    <span className={cn("flex min-w-0 items-end gap-[3pt]", ROW_MIN, ROW_LEADING, className)} style={{ flexGrow: grow }}>
      {label ? <span className="shrink-0">{label}</span> : null}
      <span className={cn("min-w-[12mm] flex-1 px-[2pt] wrap-break-word", handwritten && "border-b border-foreground", ROW_LEADING)}>{text}</span>
    </span>
  );
}
