import type { Role } from "@/store/useSessionStore";
import { PATHS } from "@/routes/paths";

/** Secciones de la zona privada (cada proyecto derivado sustituye las de ejemplo). */
export type SectionId = "home" | "moduleA" | "moduleB" | "users" | "records" | "profile";

/**
 * Política de una sección: dónde vive y quién la ve. Sin `roles` = cualquier usuario
 * autenticado. De esta lista derivan el menú (`navItems`, que solo añade etiqueta e icono)
 * y el árbol de rutas (`routes/index.tsx`): roles y rutas no se repiten en otro sitio.
 *
 * Ocultar o bloquear en el frontend NO autoriza: cada endpoint restringido necesita su
 * `@PreAuthorize` en el backend (docs/frontend.md).
 */
export interface SectionConfig {
  id: SectionId;
  path: string;
  roles?: readonly Role[];
}

export const sections: readonly SectionConfig[] = [
  { id: "home", path: PATHS.ROOT },
  // La coordinación solo ve Inicio e Historias clínicas.
  { id: "moduleA", path: PATHS.MODULE_A, roles: ["ADMIN", "USER"] },
  // Ejemplo de sección restringida: solo administradores.
  { id: "moduleB", path: PATHS.MODULE_B, roles: ["ADMIN"] },
  // Gestión de cuentas (capacidad users).
  { id: "users", path: PATHS.USERS, roles: ["ADMIN"] },
  // Historias clínicas: todos los autenticados; el alcance (las propias / todas / las de sus turmas)
  // lo aplica el backend. El formulario solo para quienes escriben (RECORD_EDITOR_ROLES).
  { id: "records", path: PATHS.RECORDS },
  // "Mis datos": cada cuenta, la suya (el backend toma la cuenta del token).
  { id: "profile", path: PATHS.PROFILE },
];

/** Roles que crean y editan historias: la coordinación es de solo lectura (vista preliminar). */
export const RECORD_EDITOR_ROLES: readonly Role[] = ["ADMIN", "USER"];

export function sectionById(id: SectionId): SectionConfig {
  const section = sections.find((s) => s.id === id);
  if (!section) throw new Error(`Sección no declarada: ${id}`);
  return section;
}

/** ¿Puede este rol entrar en la sección (y en todas sus subrutas)? */
export function canAccess(section: SectionConfig, role: Role): boolean {
  return !section.roles || section.roles.includes(role);
}
