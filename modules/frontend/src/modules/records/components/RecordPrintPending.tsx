import { Printer } from "lucide-react";
import { Button } from "@/modules/core/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/modules/core/ui/tooltip";

const NEEDS_SAVE = "Guarda los cambios para ver la vista previa e imprimir";

/**
 * "Vista previa" deshabilitada mientras hay cambios sin guardar, con un tooltip que explica por
 * qué. Un botón deshabilitado no recibe el puntero ni el foco: el disparador es un `span`
 * enfocable que lo envuelve. El tooltip es solo visual (el motivo ya va en `aria-describedby`).
 */
export function RecordPrintPending() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} aria-describedby={undefined} className="inline-flex rounded-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
          <Button type="button" variant="outline" size="sm" disabled aria-describedby="print-needs-save" className="pointer-events-none">
            <Printer className="size-4" aria-hidden="true" /> Vista previa
            <span id="print-needs-save" className="sr-only">{NEEDS_SAVE}</span>
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{NEEDS_SAVE}</TooltipContent>
    </Tooltip>
  );
}
