import type { ReactNode } from "react";
import { cn } from "@/modules/core/utils/cn";

interface ComputedValueProps {
  /** Nombre accesible (p. ej. "Espacio requerido, Mandíbula derecho"). */
  label: string;
  /** Valor ya formateado; vacío muestra "—". */
  children?: ReactNode;
  className?: string;
}

/**
 * Valor calculado con el aspecto de un campo (mismo borde y alto) pero bloqueado: fondo apagado,
 * sin foco ni selección. Sirve para que entradas y resultados de una tabla guarden concordancia.
 */
export function ComputedValue({ label, children, className }: ComputedValueProps) {
  const empty = children === null || children === undefined || children === "";
  return (
    <output
      aria-label={label}
      className={cn(
        "flex h-8 cursor-not-allowed select-none items-center justify-center rounded-md border border-input bg-muted px-2 tabular-nums text-muted-foreground",
        className,
      )}
    >
      {empty ? "—" : children}
    </output>
  );
}
