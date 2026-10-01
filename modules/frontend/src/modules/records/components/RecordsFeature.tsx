import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/modules/core/ui/button";
import { buttonVariants } from "@/modules/core/ui/button-variants";
import { IconInput } from "@/modules/core/ui/icon-input";
import { useDebouncedValue } from "@/modules/core/hooks/useDebouncedValue";
import { getUserFriendlyError } from "@/modules/core/utils/apiError";
import { useSessionStore } from "@/store/useSessionStore";
import { PATHS } from "@/routes/paths";
import { useRecords } from "../hooks/useRecords";
import { RecordsTable } from "./RecordsTable";
import { RecordsPagination } from "./RecordsPagination";
import { RecordsEmptyState } from "./RecordsEmptyState";

/** Historias clínicas: búsqueda, listado paginado y acceso a crear, abrir e imprimir. */
export function RecordsFeature() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const query = useDebouncedValue(search, 300);
  const records = useRecords(query, page);
  const isAdmin = useSessionStore((s) => s.user?.role === "ADMIN");

  const onSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  let content;
  if (records.isPending) {
    content = (
      <p className="flex items-center gap-2 text-muted-foreground" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Cargando historias…
      </p>
    );
  } else if (records.isError) {
    content = (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-destructive">{getUserFriendlyError(records.error)}</p>
        <Button variant="outline" size="sm" onClick={() => void records.refetch()}>
          Reintentar
        </Button>
      </div>
    );
  } else if (records.data.content.length === 0) {
    content = (
      <RecordsEmptyState
        searching={query.trim() !== ""}
        onClear={() => onSearch("")}
        onBack={page > 0 ? () => setPage((p) => p - 1) : undefined}
      />
    );
  } else {
    content = (
      <>
        <RecordsTable records={records.data.content} showAuthor={isAdmin} />
        <RecordsPagination
          page={records.data.page}
          totalPages={records.data.totalPages}
          last={records.data.last}
          loading={records.isPlaceholderData}
          onChange={setPage}
        />
      </>
    );
  }

  return (
    <section aria-labelledby="records-title" className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 id="records-title" className="text-2xl font-bold">
            Historias clínicas
          </h1>
          <p className="text-muted-foreground">
            {isAdmin ? "Historias de ortodoncia de todos los tratantes." : "Tus historias clínicas de ortodoncia."}
          </p>
        </div>
        <Link to={PATHS.RECORD_NEW} className={buttonVariants()}>
          <Plus className="size-4" aria-hidden="true" /> Nueva historia
        </Link>
      </header>
      <div className="max-w-md">
        <IconInput
          type="search"
          aria-label="Buscar historias"
          placeholder="Buscar por paciente, documento o número (AEO-001)"
          icon={<Search className="size-4" />}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      {content}
    </section>
  );
}
