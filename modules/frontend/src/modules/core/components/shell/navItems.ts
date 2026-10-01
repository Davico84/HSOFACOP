import type { LucideIcon } from "lucide-react";
import { Boxes, FolderKanban, LayoutDashboard, Users } from "lucide-react";
import { canAccess, sectionById, type SectionId } from "@/modules/core/config/sections";
import type { Role } from "@/store/useSessionStore";

/** `id` del cajón móvil (lo referencia el botón de menú con `aria-controls`). */
export const MOBILE_NAV_ID = "mobile-nav";

/** Entrada de navegación ya resuelta: la sidebar la pinta, no decide qué existe ni quién la ve. */
export interface NavItemConfig {
  label: string;
  icon: LucideIcon;
  to: string;
}

/** Presentación de cada sección en el menú. La ruta y los roles salen de `core/config/sections`. */
interface NavEntry {
  sectionId: SectionId;
  label: string;
  icon: LucideIcon;
}

/**
 * Menú de la zona privada. Añadir una sección = declararla en `core/config/sections.ts`,
 * añadir aquí su etiqueta e icono y montar su subárbol en `routes/index.tsx` con `sectionRoute`.
 * Los "Módulo A/B" son de ejemplo.
 */
const navEntries: readonly NavEntry[] = [
  { sectionId: "home", label: "Inicio", icon: LayoutDashboard },
  { sectionId: "moduleA", label: "Módulo A", icon: FolderKanban },
  { sectionId: "moduleB", label: "Módulo B", icon: Boxes },
  { sectionId: "users", label: "Usuarios", icon: Users },
];

/** Ítems que ve un rol (los de secciones sin `roles` los ven todos). */
export function navItemsFor(role: Role): NavItemConfig[] {
  return navEntries
    .map((entry) => ({ entry, section: sectionById(entry.sectionId) }))
    .filter(({ section }) => canAccess(section, role))
    .map(({ entry, section }) => ({ label: entry.label, icon: entry.icon, to: section.path }));
}
