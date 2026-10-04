import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/modules/core/ui/button";
import type { RecordResponse } from "@/modules/core/services/generated/model";
import { applyServerFieldErrors, getFieldErrors, getUserFriendlyError, problemType } from "@/modules/core/utils/apiError";
import { useSessionStore } from "@/store/useSessionStore";
import { recordPath } from "@/routes/paths";
import { recordFormSchema, type RecordFormValues } from "../schemas/record";
import { parseStep, RECORD_STEPS, stepOfField } from "../config/recordSteps";
import { emptyRecordValues, toFormValues } from "../utils/recordForm";
import { STALE_RECORD_TYPE } from "../hooks/recordKeys";
import { useSaveRecord } from "../hooks/useSaveRecord";
import { useLeaveGuard } from "../hooks/useLeaveGuard";
import { RecordStepper } from "./RecordStepper";
import { RecordStepContent } from "./RecordStepContent";
import { StaleRecordBanner } from "./StaleRecordBanner";
import { LeaveConfirmDialog } from "./LeaveConfirmDialog";
import { RecordPrintLink } from "./RecordPrintLink";
import { RecordPrintPending } from "./RecordPrintPending";

interface RecordFormProps {
  /** Historia cargada; `null` = nueva (se crea al guardar el paso 1). */
  record: RecordResponse | null;
  /** Recarga la historia del servidor y vuelve a montar el formulario con ella (tras un 409). */
  onReload?: () => Promise<void>;
}

/**
 * Formulario de 8 pasos de la historia. Cambiar de paso guarda antes si hay cambios (validando
 * solo el paso actual); si el guardado falla se queda en el paso. Una historia nueva se crea al
 * salir del paso 1 y pasa a su URL. Detecta ediciones concurrentes (409) y avisa al salir con
 * cambios sin guardar.
 */
export function RecordForm({ record, onReload }: RecordFormProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const fullName = useSessionStore((s) => s.user?.fullName);
  const step = record ? parseStep(searchParams.get("paso")) : 1;

  const form = useForm<RecordFormValues>({
    resolver: zodResolver(recordFormSchema),
    mode: "onTouched",
    defaultValues: record ? toFormValues(record) : emptyRecordValues(fullName),
  });
  const save = useSaveRecord();
  const [stale, setStale] = useState(false);
  const [reloading, setReloading] = useState(false);
  const dirty = form.formState.isDirty;
  const { blocker, allowNextNavigation } = useLeaveGuard(dirty);

  const showStep = (target: number) => setSearchParams({ paso: String(target) });

  const onSaveError = (error: unknown, retry: () => void) => {
    if (problemType(error) === STALE_RECORD_TYPE) {
      setStale(true);
      return;
    }
    const marked = applyServerFieldErrors(error, form.setError);
    if (marked > 0) {
      const first = stepOfField(getFieldErrors(error)[0].field.replace(/\[(\d+)\]/g, ".$1"));
      if (first && first.number !== step) {
        toast.error(`Hay datos inválidos en el paso ${first.number}: ${first.title}.`);
      }
      return;
    }
    toast.error(getUserFriendlyError(error), { action: { label: "Reintentar", onClick: retry } });
  };

  /** Guarda (si hace falta) y abre `target`; `target === step` = solo guardar. */
  const goTo = async (target: number) => {
    if (save.isPending) return;
    if (record && !dirty) {
      if (target !== step) showStep(target);
      return;
    }
    const valid = await form.trigger(RECORD_STEPS[step - 1].fields, { shouldFocus: true });
    if (!valid) return;
    save.mutate(
      { values: form.getValues(), existing: record ? { id: record.id, version: record.version } : undefined },
      {
        onSuccess: (saved) => {
          form.reset(toFormValues(saved));
          if (!record) {
            allowNextNavigation();
            navigate(recordPath(saved.id, target === step ? 2 : target), { replace: true });
          } else {
            toast.success(`Historia ${saved.recordNumber} guardada`);
            if (target !== step) showStep(target);
          }
        },
        onError: (error) => onSaveError(error, () => void goTo(target)),
      },
    );
  };

  const reload = async () => {
    if (!onReload) return;
    setReloading(true);
    try {
      allowNextNavigation();
      await onReload();
    } catch (error) {
      toast.error(getUserFriendlyError(error));
      setReloading(false);
    }
  };

  const current = RECORD_STEPS[step - 1];
  const saving = save.isPending;

  return (
    <FormProvider {...form}>
      <section aria-labelledby="record-title" className="flex flex-col gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 id="record-title" className="text-2xl font-bold">
              {record ? `Historia ${record.recordNumber}` : "Nueva historia clínica"}
            </h1>
            <p className="text-muted-foreground">
              {record ? record.patientName : "Completa al menos el nombre del paciente para crearla."}
              {record && dirty ? " · Cambios sin guardar (guarda para imprimir)" : ""}
            </p>
          </div>
          {record && !dirty ? <RecordPrintLink id={record.id} recordNumber={record.recordNumber} /> : null}
          {record && dirty ? <RecordPrintPending /> : null}
        </header>

        {stale ? (
          <StaleRecordBanner reloading={reloading} onReload={() => void reload()} onDismiss={() => setStale(false)} />
        ) : null}

        <RecordStepper current={step} disabled={saving || !record} onSelect={(n) => void goTo(n)} />

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void goTo(step < RECORD_STEPS.length ? step + 1 : step);
          }}
          className="flex flex-col gap-6"
        >
          <h2 className="text-xl font-semibold">
            {current.number}. {current.title} <span className="text-sm font-normal text-muted-foreground">({current.pages})</span>
          </h2>
          <RecordStepContent step={step} recordNumber={record?.recordNumber} />

          <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background py-4">
            <Button type="button" variant="outline" disabled={step === 1 || saving} onClick={() => void goTo(step - 1)}>
              <ArrowLeft className="size-4" aria-hidden="true" /> Anterior
            </Button>
            <div className="flex gap-2">
              {record ? (
                <Button type="button" variant="outline" disabled={saving || !dirty} onClick={() => void goTo(step)}>
                  <Save className="size-4" aria-hidden="true" /> Guardar
                </Button>
              ) : null}
              {step < RECORD_STEPS.length ? (
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                  {record ? "Siguiente" : "Crear historia"} <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          </div>
        </form>
      </section>

      <LeaveConfirmDialog
        open={blocker.state === "blocked"}
        onStay={() => blocker.reset?.()}
        onLeave={() => blocker.proceed?.()}
      />
    </FormProvider>
  );
}
