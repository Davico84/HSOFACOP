import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/modules/core/ui/button";
import type { UserSummaryResponse } from "@/modules/core/services/generated/model";
import { getUserFriendlyError } from "@/modules/core/utils/apiError";
import { useUsers } from "../hooks/useUsers";
import { useChangeUserStatus } from "../hooks/useChangeUserStatus";
import { useChangeRecordQuota } from "../hooks/useChangeRecordQuota";
import { UsersTable } from "./UsersTable";
import { UsersPagination } from "./UsersPagination";
import { UsersEmptyState } from "./UsersEmptyState";
import { ChangeStatusDialog } from "./ChangeStatusDialog";
import { RecordQuotaDialog } from "./RecordQuotaDialog";

/** Gestión de cuentas (solo ADMIN): listado paginado, activar/deshabilitar cuentas USER y su cupo de historias. */
export function UsersFeature() {
  const [page, setPage] = useState(0);
  const [target, setTarget] = useState<UserSummaryResponse | null>(null);
  const users = useUsers(page);
  const change = useChangeUserStatus();
  const pendingId = change.isPending ? (change.variables?.id ?? null) : null;
  const [quotaTarget, setQuotaTarget] = useState<UserSummaryResponse | null>(null);
  const changeQuota = useChangeRecordQuota();
  const quotaPendingId = changeQuota.isPending ? (changeQuota.variables?.id ?? null) : null;

  const confirm = (user: UserSummaryResponse) => {
    setTarget(null);
    change.mutate({ id: user.id, status: user.status === "ACTIVE" ? "DISABLED" : "ACTIVE" });
  };

  const confirmQuota = (user: UserSummaryResponse, recordQuota: number | null) => {
    setQuotaTarget(null);
    changeQuota.mutate({ id: user.id, recordQuota });
  };

  let content;
  if (users.isPending) {
    content = (
      <p className="flex items-center gap-2 text-muted-foreground" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Cargando usuarios…
      </p>
    );
  } else if (users.isError) {
    content = (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-destructive">{getUserFriendlyError(users.error)}</p>
        <Button variant="outline" size="sm" onClick={() => void users.refetch()}>
          Reintentar
        </Button>
      </div>
    );
  } else if (users.data.content.length === 0) {
    content = <UsersEmptyState onBack={page > 0 ? () => setPage((p) => p - 1) : undefined} />;
  } else {
    content = (
      <>
        <UsersTable
          users={users.data.content}
          pendingId={pendingId}
          quotaPendingId={quotaPendingId}
          onRequestChange={setTarget}
          onRequestQuota={setQuotaTarget}
        />
        <UsersPagination
          page={users.data.page}
          totalPages={users.data.totalPages}
          last={users.data.last}
          loading={users.isPlaceholderData}
          onChange={setPage}
        />
      </>
    );
  }

  return (
    <section aria-labelledby="users-title" className="flex flex-col gap-6">
      <header>
        <h1 id="users-title" className="text-2xl font-bold">
          Usuarios
        </h1>
        <p className="text-muted-foreground">Activa o deshabilita las cuentas de los usuarios y fija cuántas historias pueden crear.</p>
      </header>
      {content}
      <ChangeStatusDialog user={target} onConfirm={confirm} onCancel={() => setTarget(null)} />
      <RecordQuotaDialog user={quotaTarget} onConfirm={confirmQuota} onCancel={() => setQuotaTarget(null)} />
    </section>
  );
}
