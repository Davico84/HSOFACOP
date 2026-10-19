import type { Role } from "@/store/useSessionStore";
import { PATHS } from "@/routes/paths";

/**
 * Ruta de inicio según el rol. Por ahora todos van al panel raíz (Inicio muestra el panel de cada
 * rol); si un rol necesita otra entrada se ajusta aquí sin tocar los guards.
 */
export function roleHome(role: Role): string {
  switch (role) {
    case "ADMIN":
    case "USER":
    case "COORDINATOR":
      return PATHS.ROOT;
    default:
      return PATHS.ROOT;
  }
}
