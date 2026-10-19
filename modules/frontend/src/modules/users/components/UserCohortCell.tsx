import { Badge } from "@/modules/core/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/modules/core/ui/select";
import type { CohortResponse, UserSummaryResponse } from "@/modules/core/services/generated/model";
import { useChangeUserCohort } from "../hooks/useChangeUserCohort";

const NONE = "none";

interface UserCohortCellProps {
  user: UserSummaryResponse;
  cohorts: CohortResponse[];
}

/**
 * Turma de la cuenta: un alumno la elige en un selector ("Sin turma" la quita); una coordinación
 * muestra las turmas que supervisa; un ADMIN no tiene turma.
 */
export function UserCohortCell({ user, cohorts }: UserCohortCellProps) {
  const change = useChangeUserCohort();
  if (user.role === "COORDINATOR") {
    return (
      <ul className="flex max-w-48 flex-wrap gap-1" aria-label={`Turmas que coordina ${user.fullName}`}>
        {user.coordinatorCohorts.map((c) => (
          <li key={c.id}>
            <Badge variant="outline">{c.name}</Badge>
          </li>
        ))}
      </ul>
    );
  }
  if (user.role !== "USER") return <span className="text-muted-foreground">—</span>;
  return (
    <Select
      value={user.cohort ? String(user.cohort.id) : NONE}
      disabled={change.isPending}
      onValueChange={(next) => change.mutate({ id: user.id, cohortId: next === NONE ? null : Number(next) })}
    >
      <SelectTrigger size="sm" aria-label={`Turma de ${user.fullName}`} className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>Sin turma</SelectItem>
        {cohorts.map((cohort) => (
          <SelectItem key={cohort.id} value={String(cohort.id)}>
            {cohort.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
