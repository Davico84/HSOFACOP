import type { ReactNode } from "react";
import { cn } from "@/modules/core/utils/cn";
import { LABEL, ROW_LEADING, ROW_MIN } from "./printStyle";

interface PrintFieldProps {
  label: ReactNode;
  value?: string | number | null;
  /** Ancho relativo de la línea (como en el PDF). */
  grow?: number;
  className?: string;
  /**
   * Lleva raya bajo el valor: campos que se llenan a mano (firma, fecha) y los datos del paciente
   * de la hoja 1, que conservan la forma del PDF (revisión del usuario).
   */
  lined?: boolean;
  /** Valor centrado sobre la línea (datos cortos: edad, fechas, documento, celular). */
  center?: boolean;
}

/**
 * "Etiqueta valor": el dato sale impreso como texto, sin raya (las rayas eran para escribir a
 * mano). Con `lined`, la raya se conserva (firma, fecha y los datos del paciente).
 */
export function PrintField({ label, value, grow = 1, className, lined = false, center = false }: PrintFieldProps) {
  const text = value === null || value === undefined ? "" : String(value);
  return (
    // La etiqueta va con el primer renglón del valor; un valor largo continúa debajo, en su columna.
    // Los datos cortos centrados (edad, fechas, documento, celular) no se comprimen ni se parten.
    <span
      className={cn("flex min-w-0 items-baseline gap-[3pt]", center && "shrink-0", ROW_MIN, ROW_LEADING, className)}
      style={{ flexGrow: grow }}
    >
      {label ? <span className={cn("shrink-0", LABEL)}>{label}</span> : null}
      <span className={cn("min-w-[12mm] flex-1 px-[2pt] wrap-break-word", lined && "border-b border-foreground", center && "text-center whitespace-nowrap", ROW_LEADING)}>{text}</span>
    </span>
  );
}
