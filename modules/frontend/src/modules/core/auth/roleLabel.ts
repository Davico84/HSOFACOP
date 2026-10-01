import type { Role } from "@/store/useSessionStore";

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrador",
  USER: "Usuario",
};

/** Nombre legible del rol para mostrar en la UI. */
export function roleLabel(role: Role): string {
  return ROLE_LABELS[role];
}
