import type { ReactNode } from "react";
import { cn } from "@/modules/core/utils/cn";
import { LABEL, ROW_LEADING } from "./printStyle";

interface PrintLinesProps {
  label?: ReactNode;
  value?: string | null;
  /** Renglones que reservaba el PDF (referencia del original; ya no se dibujan). */
  lines: number;
  /** Texto a imprimir si no se escribió nada (p. ej. "No refiere"); sin él, renglones en blanco. */
  emptyText?: string;
}

/**
 * Texto largo impreso tal cual (sin renglones: eran para escribir a mano). Si está vacío no se
 * imprime nada, salvo `emptyText` (p. ej. "No refiere" en la anamnesis). Un texto largo fluye a
 * la hoja siguiente.
 */
export function PrintLines({ label, value, emptyText }: PrintLinesProps) {
  const text = value?.trim() || emptyText || "";
  return (
    <div className="flex flex-col">
      {label ? <p className={cn("mt-[7pt]", LABEL, ROW_LEADING)}>{label}</p> : null}
      {text ? <p className={cn("whitespace-pre-wrap wrap-break-word", ROW_LEADING)}>{text}</p> : null}
    </div>
  );
}
