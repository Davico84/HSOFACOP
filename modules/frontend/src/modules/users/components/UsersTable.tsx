import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/modules/core/ui/table";
import type { CohortResponse, UserSummaryResponse } from "@/modules/core/services/generated/model";
import { UserStatusBadge } from "./UserStatusBadge";
import { UserRowAction, type UserRowHandlers } from "./UserRowAction";
import { UserCohortCell } from "./UserCohortCell";
import { UserIdentity } from "./UserIdentity";
import { UserRoleBadge } from "./UserRoleBadge";
import { UserRecordUsage } from "./UserRecordUsage";

interface UsersTableProps extends UserRowHandlers {
  users: UserSummaryResponse[];
  /** Turmas para el selector de los alumnos. */
  cohorts: CohortResponse[];
  /** Cuenta cuyo cambio de estado está en curso (su acción no puede repetirse). */
  pendingId: number | null;
  /** Cuenta cuyo cambio de cupo está en curso. */
  quotaPendingId: number | null;
  /** Cuenta cuyo cambio de rol o de turmas de coordinación está en curso. */
  rolePendingId: number | null;
}

export function UsersTable({ users, cohorts, pendingId, quotaPendingId, rolePendingId, ...handlers }: UsersTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Cuenta</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Turma</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Historias</TableHead>
            <TableHead className="pr-4 text-right">
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className={user.status === "DISABLED" ? "bg-muted/30" : undefined}>
              <TableCell className="max-w-72 py-3 pl-4">
                <UserIdentity user={user} />
              </TableCell>
              <TableCell>
                <UserRoleBadge role={user.role} />
              </TableCell>
              <TableCell>
                <UserCohortCell user={user} cohorts={cohorts} />
              </TableCell>
              <TableCell>
                <UserStatusBadge status={user.status} />
              </TableCell>
              <TableCell>
                <UserRecordUsage user={user} />
              </TableCell>
              <TableCell className="pr-4 text-right">
                <UserRowAction
                  user={user}
                  pending={pendingId === user.id}
                  quotaPending={quotaPendingId === user.id}
                  rolePending={rolePendingId === user.id}
                  {...handlers}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
