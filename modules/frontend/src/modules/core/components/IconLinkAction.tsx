import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { buttonVariants } from "@/modules/core/ui/button-variants";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/modules/core/ui/tooltip";
import { cn } from "@/modules/core/utils/cn";

interface IconLinkActionProps {
  icon: LucideIcon;
  to: string;
  /** Estado de navegación (p. ej. `returnTo` para volver al listado). */
  state?: unknown;
  /** Texto del tooltip (lo que hace la acción, corto). */
  label: string;
  /** Nombre accesible completo (p. ej. con el número de la fila); por defecto, `label`. */
  ariaLabel?: string;
}

/**
 * Enlace de solo ícono con tooltip (acciones de fila que navegan), con el aspecto de `IconAction`.
 * El tooltip es solo visual: el nombre accesible es el `aria-label`. 32 px con ratón y 44 px en táctil.
 */
export function IconLinkAction({ icon: Icon, to, state, label, ariaLabel }: IconLinkActionProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={to}
          state={state}
          aria-label={ariaLabel ?? label}
          aria-describedby={undefined}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "size-8 text-muted-foreground hover:text-foreground pointer-coarse:size-11")}
        >
          <Icon className="size-4" aria-hidden="true" />
        </Link>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
