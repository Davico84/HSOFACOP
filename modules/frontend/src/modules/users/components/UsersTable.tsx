import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/modules/core/ui/table";
import type { CohortResponse, UserSummaryResponse } from "@/modules/core/services/generated/model";
import { roleLabel } from "@/modules/core/auth/roleLabel";
import { UserStatusBadge } from "./UserStatusBadge";
import { UserRowAction, type UserRowHandlers } from "./UserRowAction";
import { UserCohortCell } from "./UserCohortCell";
import { recordUsage } from "../utils/quota";

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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Correo</TableHead>
          <TableHead>Rol</TableHead>
          <TableHead>Turma</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Historias</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.fullName}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{roleLabel(user.role)}</TableCell>
            <TableCell>
              <UserCohortCell user={user} cohorts={cohorts} />
            </TableCell>
            <TableCell>
              <UserStatusBadge status={user.status} />
            </TableCell>
            <TableCell className="tabular-nums">{recordUsage(user)}</TableCell>
            <TableCell className="text-right">
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
  );
}
