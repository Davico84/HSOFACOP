import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/modules/core/ui/button";
import { IconInput } from "@/modules/core/ui/icon-input";
import { useDebouncedValue } from "@/modules/core/hooks/useDebouncedValue";
import { useMediaQuery } from "@/modules/core/hooks/useMediaQuery";
import { getUserFriendlyError } from "@/modules/core/utils/apiError";
import { useSessionStore } from "@/store/useSessionStore";
import { useRecordsListStore } from "@/store/useRecordsListStore";
import { useRecords } from "../hooks/useRecords";
import { RecordsCardList } from "./RecordsCardList";
import { RecordsTable } from "./RecordsTable";
import { RecordsPagination } from "./RecordsPagination";
import { RecordsEmptyState } from "./RecordsEmptyState";
import { NewRecordLink } from "./NewRecordLink";
import { RecordQuotaNotice } from "./RecordQuotaNotice";
import { RecordsCohortFilter } from "./RecordsCohortFilter";
import { recordsListViewFor } from "../utils/recordsListView";

const SUBTITLE = {
  own: "Tus historias clínicas de ortodoncia.",
  all: "Historias de ortodoncia de todos los tratantes.",
  cohorts: "Historias de los alumnos de tus turmas, en solo lectura.",
} as const;

/**
 * Historias clínicas: búsqueda, listado paginado y acceso a crear, abrir e imprimir. La búsqueda,
 * la página y la turma (coordinación) viven en la URL (`?q=…&pagina=N&turma=id`): volver de la vista
 * previa o recargar las conserva. La coordinación ve las historias de sus turmas en solo lectura.
 */
export function RecordsFeature() {
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const page = Math.max(0, (Number(params.get("pagina")) || 1) - 1);
  const cohortId = Number(params.get("turma")) || null;
  const [search, setSearch] = useState(query);
  const debounced = useDebouncedValue(search, 300);
  const role = useSessionStore((s) => s.user?.role);
  const view = recordsListViewFor(role);
  const records = useRecords(query, page, view === "cohorts" ? cohortId : null);
  // Tabla desde 1024 px; debajo, tarjetas (la tabla dejaba las acciones fuera de la pantalla).
  const desktop = useMediaQuery("(min-width: 1024px)", true);
  const userId = useSessionStore((s) => s.user?.id);
  const { pathname, search: urlSearch } = useLocation();
  const setListUrl = useRecordsListStore((s) => s.setListUrl);

  // Recuerda esta URL (búsqueda y página) para "← Historias clínicas" desde una historia.
  useEffect(() => {
    if (userId != null) setListUrl(`${pathname}${urlSearch}`, userId);
  }, [pathname, urlSearch, userId, setListUrl]);

  // Lo escrito pasa a la URL al dejar de teclear (y vuelve a la página 1).
  useEffect(() => {
    // Solo un término ya asentado (si aún se escribe o se acaba de limpiar, no se pisa la URL).
    if (debounced !== search || debounced.trim() === query.trim()) return;
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (debounced.trim()) next.set("q", debounced.trim());
        else next.delete("q");
        next.delete("pagina");
        return next;
      },
      { replace: true },
    );
  }, [debounced, search, query, setParams]);

  const setPage = (next: number | ((current: number) => number)) => {
    const value = typeof next === "function" ? next(page) : next;
    setParams((prev) => {
      const out = new URLSearchParams(prev);
      if (value > 0) out.set("pagina", String(value + 1));
      else out.delete("pagina");
      return out;
    });
  };

  const setCohort = (next: number | null) => {
    setParams((prev) => {
      const out = new URLSearchParams(prev);
      if (next == null) out.delete("turma");
      else out.set("turma", String(next));
      out.delete("pagina");
      return out;
    });
  };

  const onSearch = (value: string) => setSearch(value);
  const clearSearch = () => {
    setSearch("");
    setParams({}, { replace: true });
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
        onClear={clearSearch}
        onBack={page > 0 ? () => setPage((p) => p - 1) : undefined}
        readOnly={view === "cohorts"}
      />
    );
  } else {
    content = (
      <>
        {desktop ? (
          <RecordsTable records={records.data.content} view={view} />
        ) : (
          <RecordsCardList records={records.data.content} view={view} />
        )}
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
            {SUBTITLE[view]}
          </p>
        </div>
        {view === "cohorts" ? null : <NewRecordLink />}
      </header>
      {view === "own" ? <RecordQuotaNotice /> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="w-full max-w-md">
        <IconInput
          type="search"
          aria-label="Buscar historias"
          placeholder="Buscar por paciente, documento o número (AEO-0001)"
          icon={<Search className="size-4" />}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
        </div>
        {view === "cohorts" ? <RecordsCohortFilter value={cohortId} onChange={setCohort} /> : null}
      </div>
      {content}
    </section>
  );
}
