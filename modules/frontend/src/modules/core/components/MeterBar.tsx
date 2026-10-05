import { cn } from "@/modules/core/utils/cn";

interface MeterBarProps {
  /** Rótulo visible a la izquierda (p. ej. "1. Paciente y anamnesis"). */
  label: string;
  value: number;
  /** Valor máximo de la serie: el largo es proporcional (con 0, la barra queda vacía). */
  max: number;
  /** Texto del valor, visible a la derecha (por defecto el número). */
  valueText?: string;
  className?: string;
}

/**
 * Fila con rótulo, barra proporcional y valor visible (sin depender del color ni del largo para
 * leer el dato). Genérica: sirve para cualquier serie de conteos.
 */
export function MeterBar({ label, value, max, valueText, className }: MeterBarProps) {
  const percent = Math.round((value / Math.max(max, 1)) * 100);
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 tabular-nums text-muted-foreground">{valueText ?? value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
