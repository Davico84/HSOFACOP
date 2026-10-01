import type { ReactNode } from "react";

interface PrintLinesProps {
  label?: ReactNode;
  value?: string | null;
  /** Líneas que reserva el PDF: el texto las ocupa y, si no alcanza, continúa (y pasa de hoja). */
  lines: number;
}

/**
 * Texto largo sobre renglones: el texto escrito y, debajo, renglones en blanco hasta completar
 * los del PDF. Un texto más largo crece y fluye a la hoja siguiente sin cortarse.
 */
export function PrintLines({ label, value, lines }: PrintLinesProps) {
  const text = value?.trim() ?? "";
  const used = text ? Math.max(1, Math.ceil(text.length / 95) + (text.match(/\n/g)?.length ?? 0)) : 0;
  const blank = Math.max(0, lines - used);
  return (
    <div className="flex flex-col">
      {label ? <p className="mt-1">{label}</p> : null}
      {text ? (
        <p className="border-b border-foreground leading-[1.6] whitespace-pre-wrap wrap-break-word">
          {text}
        </p>
      ) : null}
      {Array.from({ length: blank }, (_, i) => (
        <span key={i} className="block h-[1.6em] border-b border-foreground" />
      ))}
    </div>
  );
}
