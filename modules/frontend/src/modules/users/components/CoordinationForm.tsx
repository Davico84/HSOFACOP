import { useState, type FormEvent } from "react";
import { Button } from "@/modules/core/ui/button";
import { buttonVariants } from "@/modules/core/ui/button-variants";
import { DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/modules/core/ui/dialog";
import type { CohortResponse, UserSummaryResponse } from "@/modules/core/services/generated/model";
import type { CoordinationDialogProps } from "./CoordinationDialog";

interface CoordinationFormProps {
  user: UserSummaryResponse;
  cohorts: CohortResponse[];
  onConfirm: CoordinationDialogProps["onConfirm"];
}

/** Contenido del diálogo de coordinación: casillas de turmas (al menos una). */
export function CoordinationForm({ user, cohorts, onConfirm }: CoordinationFormProps) {
  const converting = user.role !== "COORDINATOR";
  const [selected, setSelected] = useState<number[]>(user.coordinatorCohorts.map((c) => c.id));
  const valid = selected.length > 0;

  const toggle = (id: number, checked: boolean) =>
    setSelected((current) => (checked ? [...current, id] : current.filter((c) => c !== id)));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (valid) onConfirm(user, selected);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{converting ? `Convertir a ${user.fullName} en coordinación` : `Turmas de ${user.fullName}`}</DialogTitle>
        <DialogDescription>
          {converting
            ? "Verá en solo lectura las historias y el avance de los alumnos de las turmas que marques. Pierde su turma de alumno y su cupo, y el cambio vale desde su próximo ingreso (como tarde en 15 minutos)."
            : "Verá en solo lectura las historias y el avance de los alumnos de las turmas que marques."}
        </DialogDescription>
      </DialogHeader>
      {cohorts.length === 0 ? (
        <p className="text-sm text-muted-foreground">Primero crea una turma con el botón "Turmas".</p>
      ) : (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium">Turmas</legend>
          {cohorts.map((cohort) => (
            <label key={cohort.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-primary"
                checked={selected.includes(cohort.id)}
                onChange={(e) => toggle(cohort.id, e.target.checked)}
              />
              {cohort.name}
            </label>
          ))}
        </fieldset>
      )}
      {!valid && cohorts.length > 0 ? (
        <p className="text-sm text-destructive" role="alert">
          Marca al menos una turma.
        </p>
      ) : null}
      <DialogFooter>
        <DialogClose className={buttonVariants({ variant: "outline" })}>Cancelar</DialogClose>
        <Button type="submit" disabled={!valid}>
          {converting ? "Convertir" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
