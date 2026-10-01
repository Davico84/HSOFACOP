// Constantes de rutas de la aplicación.
export const PATHS = {
  ROOT: "/",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  // Secciones de ejemplo del shell: cada proyecto derivado las reemplaza.
  MODULE_A: "/modulo-a",
  MODULE_B: "/modulo-b",
  // Gestión de cuentas (capacidad users), solo ADMIN.
  USERS: "/usuarios",
} as const;
