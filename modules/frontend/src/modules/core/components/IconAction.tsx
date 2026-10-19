import { Loader2, type LucideIcon } from "lucide-react";
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
  /**
   * Acción no disponible con su motivo: queda atenuada y sin efecto, pero enfocable
   * (`aria-disabled`) para que el tooltip explique por qué (un `disabled` nativo no lo mostraría).
   */
  disabledReason?: string;
  /** "danger": resalta en rojo al pasar el ratón (acciones que quitan acceso). */
  tone?: "default" | "danger";
  /** Acción en curso: deshabilitada y con el ícono girando. */
  loading?: boolean;
}

function toneClasses(blocked: boolean, tone: "default" | "danger"): string {
  if (blocked) return "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-muted-foreground";
  return tone === "danger" ? "hover:bg-destructive/10 hover:text-destructive" : "hover:text-foreground";
}

/**
 * Botón de solo ícono con tooltip (acciones de fila de una tabla). El nombre accesible es el
 * `aria-label`; el tooltip es solo visual (`aria-describedby` anulado para no anunciarlo dos veces),
 * salvo con `disabledReason`, que el lector de pantalla sí anuncia como descripción.
 * 32 px con ratón y 44 px con pantalla táctil (`pointer-coarse`), el mínimo para tocar con el dedo.
 */
export function IconAction({
  icon: Icon,
  label,
  ariaLabel,
  onClick,
  disabled,
  disabledReason,
  tone = "default",
  loading = false,
}: IconActionProps) {
  const Shown = loading ? Loader2 : Icon;
  const blocked = disabledReason !== undefined;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={blocked ? undefined : onClick}
          disabled={disabled || loading}
          aria-disabled={blocked || undefined}
          aria-busy={loading || undefined}
          aria-label={ariaLabel ?? label}
          {...(blocked ? {} : { "aria-describedby": undefined })}
          className={cn("size-8 text-muted-foreground pointer-coarse:size-11", toneClasses(blocked, tone))}
        >
          <Shown className={cn("size-4", loading && "animate-spin")} aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{disabledReason ?? label}</TooltipContent>
    </Tooltip>
  );
}
