import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/modules/core/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/modules/core/ui/dialog";
import { getUserFriendlyError } from "@/modules/core/utils/apiError";
import type { CohortResponse } from "@/modules/core/services/generated/model";
import { useCohorts } from "../hooks/useCohorts";
import { CohortNameForm } from "./CohortNameForm";

interface CohortsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const count = (n: number | null | undefined, one: string, many: string) => `${n ?? 0} ${(n ?? 0) === 1 ? one : many}`;

/** Gestión de turmas (ADMIN): la lista con sus alumnos y coordinaciones, crear y renombrar. */
export function CohortsDialog({ open, onOpenChange }: CohortsDialogProps) {
  const cohorts = useCohorts(open);
  const [renaming, setRenaming] = useState<CohortResponse | null>(null);

  let list;
  if (cohorts.isPending) {
    list = (
      <p className="flex items-center gap-2 text-muted-foreground" role="status">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Cargando turmas…
      </p>
    );
  } else if (cohorts.isError) {
    list = (
      <p className="text-destructive" role="alert">
        {getUserFriendlyError(cohorts.error)}
      </p>
    );
  } else if (cohorts.data.length === 0) {
    list = <p className="text-muted-foreground">Aún no hay turmas.</p>;
  } else {
    list = (
      <ul className="flex flex-col divide-y divide-border rounded-md border border-border" aria-label="Turmas">
        {cohorts.data.map((cohort) => (
          <li key={cohort.id} className="flex items-center justify-between gap-3 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate font-medium">{cohort.name}</p>
              <p className="text-xs text-muted-foreground">
                {count(cohort.students, "alumno", "alumnos")} · {count(cohort.coordinators, "coordinación", "coordinaciones")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRenaming(cohort)}
              aria-label={`Renombrar la turma ${cohort.name}`}
            >
              Renombrar
            </Button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setRenaming(null);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Turmas</DialogTitle>
          <DialogDescription>Asigna las turmas a los alumnos y a las coordinaciones desde la lista de usuarios.</DialogDescription>
        </DialogHeader>
        <div className="flex max-h-72 flex-col overflow-y-auto">{list}</div>
        {/* `key`: cada turma (o "nueva") empieza con su propio nombre y sin errores anteriores. */}
        <CohortNameForm key={renaming?.id ?? "new"} cohort={renaming} onDone={() => setRenaming(null)} />
      </DialogContent>
    </Dialog>
  );
}
