import type { ReactNode } from "react";
import { cn } from "@/modules/core/utils/cn";

interface SectionStatusProps {
  /** Resalta el estado (p. ej. hay datos registrados). */
  active?: boolean;
  children: ReactNode;
}

/** Píldora de estado de una sección ("Sin datos" / "6 datos"), para la cabecera de un `AccordionSection`. */
export function SectionStatus({ active = false, children }: SectionStatusProps) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium",
        active ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}
