import type { Role } from "@/store/useSessionStore";

/**
 * Cómo se muestra el listado de historias según el rol: las propias (USER), todas con su autor
 * (ADMIN) o las de las turmas con alumno y turma, en solo lectura (COORDINATOR).
 */
export type RecordsListView = "own" | "all" | "cohorts";

export function recordsListViewFor(role: Role | undefined): RecordsListView {
  if (role === "ADMIN") return "all";
  if (role === "COORDINATOR") return "cohorts";
  return "own";
}
