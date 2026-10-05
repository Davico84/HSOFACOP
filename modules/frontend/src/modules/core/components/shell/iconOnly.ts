import { cn } from "@/modules/core/utils/cn";

/**
 * Cuándo un ítem de la barra lateral muestra solo su ícono: `"below-lg"` en la barra compacta de
 * tablet (en escritorio se ve el texto) y `"always"` con la barra contraída en escritorio. Sin
 * valor, el texto siempre se ve (cajón móvil).
 */
export type IconOnly = "below-lg" | "always";

/** Clases del ítem, de su texto y de su tooltip según `iconOnly`. */
export function iconOnlyClasses(iconOnly: IconOnly | undefined) {
  return {
    item: cn(iconOnly === "below-lg" && "justify-center lg:justify-start", iconOnly === "always" && "justify-center"),
    label: cn("truncate whitespace-nowrap", iconOnly === "below-lg" && "sr-only lg:not-sr-only", iconOnly === "always" && "sr-only"),
    /** En escritorio con la barra expandida el texto ya se ve: el tooltip no hace falta. */
    tooltip: iconOnly === "below-lg" ? "lg:hidden" : undefined,
  };
}
