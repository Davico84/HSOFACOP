// Constantes de rutas de la aplicación.
export const PATHS = {
  ROOT: "/",
  // Páginas de acceso fuera de /auth/*, que en despliegue es solo de la API (proxy de Vercel).
  LOGIN: "/ingresar",
  REGISTER: "/registro",
  // Secciones de ejemplo del shell: cada proyecto derivado las reemplaza.
  MODULE_A: "/modulo-a",
  MODULE_B: "/modulo-b",
  // Gestión de cuentas (capacidad users), solo ADMIN.
  USERS: "/usuarios",
  // Historias clínicas de ortodoncia (capacidad orthodontic-records).
  RECORDS: "/historias",
  RECORD_NEW: "/historias/nueva",
} as const;

/** Ruta de una historia (paso opcional del formulario, 1–7). */
export function recordPath(id: number, step?: number): string {
  return step ? `${PATHS.RECORDS}/${id}?paso=${step}` : `${PATHS.RECORDS}/${id}`;
}

/** Vista de impresión de una historia (fuera del shell). */
export function recordPrintPath(id: number): string {
  return `${PATHS.RECORDS}/${id}/imprimir`;
}
