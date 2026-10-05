import type { UserSummaryResponse } from "@/modules/core/services/generated/model";

/** Cupo máximo que acepta la API. */
export const MAX_RECORD_QUOTA = 9999;

/** "3 de 5", "3 · sin límite" o, en una cuenta ADMIN (nunca se limita), "3 · no aplica". */
export function recordUsage(user: UserSummaryResponse): string {
  if (user.role !== "USER") return `${user.recordCount} · no aplica`;
  if (user.recordQuota == null) return `${user.recordCount} · sin límite`;
  return `${user.recordCount} de ${user.recordQuota}`;
}
