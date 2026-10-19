import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/modules/core/ui/button";
import { Input } from "@/modules/core/ui/input";
import { getUserFriendlyError } from "@/modules/core/utils/apiError";
import type { CohortResponse } from "@/modules/core/services/generated/model";
import { COHORT_NAME_MAX } from "../hooks/cohortKeys";
import { useSaveCohort } from "../hooks/useSaveCohort";
import { cohortNameSchema, type CohortNameValues } from "../schemas/cohortName";

interface CohortNameFormProps {
  /** Turma a renombrar; `null` = crear una nueva. */
  cohort: CohortResponse | null;
  onDone: () => void;
}

/** Crea una turma o renombra la indicada; un nombre repetido muestra el mensaje del servidor. */
export function CohortNameForm({ cohort, onDone }: CohortNameFormProps) {
  const save = useSaveCohort();
  const form = useForm<CohortNameValues>({
    resolver: zodResolver(cohortNameSchema),
    mode: "onTouched",
    defaultValues: { name: cohort?.name ?? "" },
  });
  const error = form.formState.errors.name?.message ?? (save.isError ? getUserFriendlyError(save.error) : undefined);
  const inputId = cohort ? `cohort-name-${cohort.id}` : "cohort-name-new";

  const submit = form.handleSubmit((values) =>
    save.mutate(
      { id: cohort?.id ?? null, name: values.name },
      {
        onSuccess: () => {
          form.reset({ name: "" });
          onDone();
        },
      },
    ),
  );

  return (
    <form noValidate onSubmit={(e) => void submit(e)} className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium">
        {cohort ? `Nuevo nombre de ${cohort.name}` : "Nueva turma"}
      </label>
      <div className="flex gap-2">
        <Input
          id={inputId}
          maxLength={COHORT_NAME_MAX}
          placeholder="Ej.: Turma 3"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...form.register("name")}
        />
        <Button type="submit" disabled={save.isPending}>
          {cohort ? "Renombrar" : "Crear"}
        </Button>
        {cohort ? (
          <Button type="button" variant="outline" onClick={onDone}>
            Cancelar
          </Button>
        ) : null}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
