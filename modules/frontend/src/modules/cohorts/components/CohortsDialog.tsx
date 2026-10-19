import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/modules/core/ui/dialog";
import { getUserFriendlyError } from "@/modules/core/utils/apiError";
import type { CohortResponse } from "@/modules/core/services/generated/model";
import { useCohorts } from "../hooks/useCohorts";
import { useChangeCohortRegistration, useRegenerateCohortCode } from "../hooks/useCohortRegistration";
import { CohortNameForm } from "./CohortNameForm";
import { CohortRow } from "./CohortRow";
import { RegenerateCodeDialog } from "./RegenerateCodeDialog";

interface CohortsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Gestión de turmas (ADMIN): la lista con sus alumnos y coordinaciones y su código de inscripción
 * (copiar, generar uno nuevo con confirmación, abrir o cerrar la inscripción), crear y renombrar.
 */
export function CohortsDialog({ open, onOpenChange }: CohortsDialogProps) {
  const cohorts = useCohorts(open);
  const [renaming, setRenaming] = useState<CohortResponse | null>(null);
  const [regenerating, setRegenerating] = useState<CohortResponse | null>(null);
  const regenerate = useRegenerateCohortCode();
  const registration = useChangeCohortRegistration();
  const pendingId = regenerate.isPending
    ? regenerate.variables
    : registration.isPending
      ? registration.variables?.id
      : undefined;

  const confirmRegenerate = (cohort: CohortResponse) => {
    setRegenerating(null);
    regenerate.mutate(cohort.id);
  };

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
          <CohortRow
            key={cohort.id}
            cohort={cohort}
            pending={pendingId === cohort.id}
            onRename={setRenaming}
            onRegenerate={setRegenerating}
            onToggleRegistration={(c) => registration.mutate({ id: c.id, open: !(c.registrationOpen ?? false) })}
          />
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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Turmas</DialogTitle>
          <DialogDescription>
            Comparte el código de cada turma con sus alumnos: al registrarse con él quedan en la turma. Cierra la
            inscripción cuando termine.
          </DialogDescription>
        </DialogHeader>
        <div className="flex max-h-96 flex-col overflow-y-auto">{list}</div>
        {/* `key`: cada turma (o "nueva") empieza con su propio nombre y sin errores anteriores. */}
        <CohortNameForm key={renaming?.id ?? "new"} cohort={renaming} onDone={() => setRenaming(null)} />
      </DialogContent>
      <RegenerateCodeDialog cohort={regenerating} onConfirm={confirmRegenerate} onCancel={() => setRegenerating(null)} />
    </Dialog>
  );
}
