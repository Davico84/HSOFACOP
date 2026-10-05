/** Query keys de las métricas de Inicio. Las invalidan los cambios que las afectan (historias, cupos, cuentas). */
export const dashboardKeys = {
  all: ["dashboard"] as const,
  me: () => [...dashboardKeys.all, "me"] as const,
  admin: () => [...dashboardKeys.all, "admin"] as const,
};
