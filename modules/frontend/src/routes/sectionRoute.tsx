import { Outlet, type RouteObject } from "react-router-dom";
import { RequireRole } from "@/modules/core/auth/RequireRole";
import { SectionNotFound } from "@/modules/core/components/SectionNotFound";
import { sectionById, type SectionId } from "@/modules/core/config/sections";

/**
 * Subárbol de rutas de una sección: la ruta de la sección y TODAS sus subrutas quedan bajo el
 * mismo guard, con los roles de `core/config/sections` (no se repiten aquí). Una sección sin
 * `roles` no lleva guard.
 *
 * Las secciones restringidas añaden un comodín `*` bajo el guard: React Router resuelve el 404
 * global ANTES de montar cualquier guard, así que sin él un rol sin permiso distinguiría
 * subrutas existentes ("Acceso denegado") de inexistentes (404). Con él, un rol sin permiso ve
 * siempre "Acceso denegado" y uno permitido ve "no encontrado" dentro del shell.
 */
export function sectionRoute(id: SectionId, children: RouteObject[]): RouteObject {
  const section = sectionById(id);
  if (!section.roles) {
    return { path: section.path, element: <Outlet />, children };
  }
  return {
    path: section.path,
    element: <RequireRole roles={section.roles} />,
    children: [...children, { path: "*", element: <SectionNotFound /> }],
  };
}
