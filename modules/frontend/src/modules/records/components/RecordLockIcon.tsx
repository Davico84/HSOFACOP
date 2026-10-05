import { Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/modules/core/ui/tooltip";

/** Candado del listado: la historia ya se imprimió y los datos del paciente están fijos. */
export function RecordLockIcon() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          role="img"
          aria-label="Datos del paciente fijos"
          aria-describedby={undefined}
          className="inline-flex rounded-sm text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Lock className="size-3.5" aria-hidden="true" />
        </span>
      </TooltipTrigger>
      <TooltipContent>Datos del paciente fijos (ya se imprimió)</TooltipContent>
    </Tooltip>
  );
}
