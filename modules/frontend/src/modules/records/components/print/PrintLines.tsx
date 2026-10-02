import type { ReactNode } from "react";
import { cn } from "@/modules/core/utils/cn";
import { ROW, ROW_LEADING } from "./printStyle";

interface PrintLinesProps {
  label?: ReactNode;
  value?: string | null;
  /** Renglones que reserva el PDF: el texto los ocupa y, si no alcanza, continúa (y pasa de hoja). */
  lines: number;
  /** Texto a imprimir si no se escribió nada (p. ej. "No refiere"); sin él, renglones en blanco. */
  emptyText?: string;
}

/** Caracteres aproximados por renglón a Arial 10 pt en el ancho útil del PDF (161 mm). */
const CHARS_PER_ROW = 100;

/**
 * Texto largo sobre renglones de 17,3 pt (como el PDF): el texto escrito y, debajo, renglones en
 * blanco hasta completar los del PDF. Un texto más largo crece y fluye a la hoja siguiente.
 */
export function PrintLines({ label, value, lines, emptyText }: PrintLinesProps) {
  const text = value?.trim() || emptyText || "";
  const used = text
    ? text.split("\n").reduce((n, paragraph) => n + Math.max(1, Math.ceil(paragraph.length / CHARS_PER_ROW)), 0)
    : 0;
  const blank = Math.max(0, lines - used);
  return (
    <div className="flex flex-col">
      {label ? <p className={cn("mt-[7pt]", ROW_LEADING)}>{label}</p> : null}
      {text ? (
        <p className={cn("border-b border-foreground whitespace-pre-wrap wrap-break-word", ROW_LEADING)}>{text}</p>
      ) : null}
      {Array.from({ length: blank }, (_, i) => (
        <span key={i} className={cn("block border-b border-foreground", ROW)} />
      ))}
    </div>
  );
}
