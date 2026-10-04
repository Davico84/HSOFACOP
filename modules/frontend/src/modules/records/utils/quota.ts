/** Aviso de cupo lleno: el mismo texto que devuelve el servidor (409 record-quota-reached). */
export function quotaReachedMessage(limit: number): string {
  return `Alcanzaste el máximo de ${limit} ${limit === 1 ? "historia clínica" : "historias clínicas"}. Comunícate con el administrador para solicitar más.`;
}

/** "3 de 5 historias". */
export function quotaUsage(used: number, limit: number): string {
  return `${used} de ${limit} ${limit === 1 ? "historia" : "historias"}`;
}
