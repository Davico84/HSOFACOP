import type { LucideIcon } from "lucide-react";
import { Button } from "@/modules/core/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/modules/core/ui/tooltip";
import { cn } from "@/modules/core/utils/cn";

interface IconActionProps {
  icon: LucideIcon;
  /** Texto del tooltip (lo que hace la acción, corto). */
  label: string;
  /** Nombre accesible completo (p. ej. con el nombre de la fila); por defecto, `label`. */
  ariaLabel?: string;
  onClick: () => void;
  disabled?: boolean;
  /** "danger": resalta en rojo al pasar el ratón (acciones que quitan acceso). */
  tone?: "default" | "danger";
}

/**
 * Botón de solo ícono con tooltip (acciones de fila de una tabla). El nombre accesible es el
 * `aria-label`; el tooltip es solo visual (`aria-describedby` anulado para no anunciarlo dos veces).
 */
export function IconAction({ icon: Icon, label, ariaLabel, onClick, disabled, tone = "default" }: IconActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClick}
          disabled={disabled}
          aria-label={ariaLabel ?? label}
          aria-describedby={undefined}
          className={cn(
            "size-8 text-muted-foreground",
            tone === "danger" ? "hover:bg-destructive/10 hover:text-destructive" : "hover:text-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
