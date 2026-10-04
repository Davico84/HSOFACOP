import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/modules/core/ui/table";
import type { UserSummaryResponse } from "@/modules/core/services/generated/model";
import { UserStatusBadge } from "./UserStatusBadge";
import { UserRowAction } from "./UserRowAction";
import { recordUsage } from "../utils/quota";

const ROLE_LABEL: Record<UserSummaryResponse["role"], string> = { ADMIN: "Administrador", USER: "Usuario" };

interface UsersTableProps {
  users: UserSummaryResponse[];
  /** Cuenta cuyo cambio de estado está en curso (su acción no puede repetirse). */
  pendingId: number | null;
  /** Cuenta cuyo cambio de cupo está en curso. */
  quotaPendingId: number | null;
  onRequestChange: (user: UserSummaryResponse) => void;
  onRequestQuota: (user: UserSummaryResponse) => void;
}

export function UsersTable({ users, pendingId, quotaPendingId, onRequestChange, onRequestQuota }: UsersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Correo</TableHead>
          <TableHead>Rol</TableHead>
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
            <TableCell>{ROLE_LABEL[user.role]}</TableCell>
            <TableCell>
              <UserStatusBadge status={user.status} />
            </TableCell>
            <TableCell className="tabular-nums">{recordUsage(user)}</TableCell>
            <TableCell className="text-right">
              <UserRowAction
                user={user}
                pending={pendingId === user.id}
                quotaPending={quotaPendingId === user.id}
                onRequestChange={onRequestChange}
                onRequestQuota={onRequestQuota}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
