import type { ReactNode } from "react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/modules/core/ui/accordion";
import { cn } from "@/modules/core/utils/cn";

interface AccordionSectionProps {
  /** Valor del panel dentro del `Accordion`. */
  value: string;
  /** Número visible del panel (1, 2…). */
  index: number;
  title: string;
  /** Qué contiene (p. ej. "pág. 6 del PDF · espacio disponible y requerido"). */
  description?: ReactNode;
  /** Estado a la derecha (p. ej. un `SectionStatus` con "Sin datos" / "6 datos"). */
  status?: ReactNode;
  /** Clases del contenido. */
  className?: string;
  children: ReactNode;
}

/**
 * Panel plegable con aspecto de tarjeta: número, título, descripción y estado en la cabecera; al
 * abrirse se resalta el borde. Se usa dentro de un `Accordion` de `core/ui`. El contenido lleva
 * margen interno porque el panel recorta lo que sobresale (su animación lo necesita) y si no se
 * cortaría el anillo de foco de los campos pegados al borde.
 */
export function AccordionSection({ value, index, title, description, status, className, children }: AccordionSectionProps) {
  return (
    <AccordionItem
      value={value}
      className="rounded-lg border border-border bg-card transition-colors last:border-b data-[state=open]:border-primary/50 data-[state=open]:shadow-sm"
    >
      <AccordionTrigger className="items-center gap-3 rounded-lg px-4 py-3 hover:bg-accent/50 hover:no-underline data-[state=open]:rounded-b-none">
        <span className="flex min-w-0 flex-1 items-center gap-3">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
            aria-hidden="true"
          >
            {index}
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-base font-semibold">{title}</span>
            {description ? <span className="text-xs font-normal text-muted-foreground">{description}</span> : null}
          </span>
        </span>
        {status}
      </AccordionTrigger>
      <AccordionContent className={cn("flex flex-col gap-6 border-t border-border px-5 pt-5", className)}>
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}
