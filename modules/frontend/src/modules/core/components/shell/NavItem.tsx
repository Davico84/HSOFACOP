import { NavLink, useMatch, useResolvedPath } from "react-router-dom";
import { cn } from "@/modules/core/utils/cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/modules/core/ui/tooltip";
import { PATHS } from "@/routes/paths";
import type { NavItemConfig } from "./navItems";
import { iconOnlyClasses, type IconOnly } from "./iconOnly";

interface NavItemProps {
  item: NavItemConfig;
  /** Solo ícono (barra compacta o contraída); la etiqueta queda para lectores de pantalla. */
  iconOnly?: IconOnly;
  /** Se invoca al navegar (p. ej. para cerrar el cajón móvil). */
  onNavigate?: () => void;
}

/**
 * Enlace de navegación del shell. `NavLink` marca el activo con `aria-current="page"`.
 * En la barra compacta o contraída muestra el nombre en un tooltip (solo visual: el nombre accesible
 * ya es el `aria-label`, así que se anula el `aria-describedby` para no anunciarlo dos veces).
 *
 * El estado activo se calcula aquí (useMatch) y `className` se pasa como TEXTO: dentro de
 * `TooltipTrigger asChild`, el Slot de Radix concatena `className` como cadena y una
 * función (la forma `({ isActive }) => …` de NavLink) acabaría convertida en su código fuente.
 */
export function NavItem({ item, iconOnly, onNavigate }: NavItemProps) {
  const classes = iconOnlyClasses(iconOnly);
  const Icon = item.icon;
  const end = item.to === PATHS.ROOT;
  const resolved = useResolvedPath(item.to);
  const isActive = useMatch({ path: resolved.pathname, end }) !== null;
  const link = (
    <NavLink
      to={item.to}
      end={end}
      onClick={onNavigate}
      aria-label={iconOnly ? item.label : undefined}
      aria-describedby={undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
        classes.item,
        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <span className={classes.label}>{item.label}</span>
    </NavLink>
  );
  if (!iconOnly) return link;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" className={classes.tooltip}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}
