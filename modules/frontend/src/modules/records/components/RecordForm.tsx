import { useCallback, useEffect, useRef, useState } from "react";
import { FormProvider, useForm, type Path } from "react-hook-form";
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
import { diffPaths, relatedPaths, valueAt } from "../utils/formDiff";
import { PATIENT_LOCKED_TYPE, RECORD_QUOTA_REACHED_TYPE, STALE_RECORD_TYPE } from "../hooks/recordKeys";
import { errorPaths } from "../hooks/useStepStatus";
import { useSaveRecord } from "../hooks/useSaveRecord";
import { useRecordQuota } from "../hooks/useRecordQuota";
import { quotaReachedMessage } from "../utils/quota";
import { FieldHint } from "@/modules/core/components/form/FieldHint";
import { useLeaveGuard } from "../hooks/useLeaveGuard";
import { useAutosave, type AutosaveResult } from "../hooks/useAutosave";
import { RecordStepNav, type StepChange } from "./RecordStepNav";
import { RecordStepContent } from "./RecordStepContent";
import { StaleRecordBanner } from "./StaleRecordBanner";
import { LeaveConfirmDialog } from "./LeaveConfirmDialog";
import { RecordPrintLink } from "./RecordPrintLink";
import { RecordPrintPending } from "./RecordPrintPending";
import { RecordsBackLink } from "./RecordsBackLink";
import { PatientLockNotice } from "./PatientLockNotice";
import { RecordSaveStatus } from "./RecordSaveStatus";

interface RecordFormProps {
  /** Historia cargada; `null` = nueva (se crea al guardar el paso 1). */
  record: RecordResponse | null;
  /** Recarga la historia del servidor y vuelve a montar el formulario con ella (tras un 409). */
  onReload?: () => Promise<void>;
}

/** Resultado de guardar una historia existente; "unchanged" = no había cambios (no se envía nada). */
type PersistResult = AutosaveResult | "unchanged";

/**
 * Formulario de 8 pasos de la historia. Cambiar de paso guarda antes si hay cambios (validando
 * solo el paso actual); si el guardado falla se queda en el paso. Una historia nueva se crea al
 * salir del paso 1 y pasa a su URL. Una existente además se autoguarda y se abre en su último paso
 * trabajado. Detecta ediciones concurrentes (409) y avisa al salir con cambios sin guardar.
 */
export function RecordForm({ record, onReload }: RecordFormProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const fullName = useSessionStore((s) => s.user?.fullName);
  const stepParam = searchParams.get("paso");
  // Sin `?paso=`, la historia se abre en su último paso trabajado.
  const step = record ? parseStep(stepParam ?? String(record.lastStep ?? 1)) : 1;

  const form = useForm<RecordFormValues>({
    resolver: zodResolver(recordFormSchema),
    mode: "onTouched",
    defaultValues: record ? toFormValues(record) : emptyRecordValues(fullName),
  });
  const save = useSaveRecord();
  const [stale, setStale] = useState(false);
  const [reloading, setReloading] = useState(false);
  const dirty = form.formState.isDirty;
  // Historia nueva con el cupo lleno: aviso desde el inicio y "Crear historia" deshabilitado.
  const quota = useRecordQuota(!record);
  const quotaLimit = !record && quota.data?.reached ? quota.data.limit : null;
  const { blocker, allowNextNavigation } = useLeaveGuard(dirty);

  const showStep = (target: number) => setSearchParams({ paso: String(target) });

  useEffect(() => {
    if (record && stepParam === null) setSearchParams({ paso: String(step) }, { replace: true });
  }, [record, stepParam, step, setSearchParams]);

  // Versión de la última respuesta (el autoguardado puede encadenar guardados antes de re-renderizar).
  const version = useRef(record?.version ?? 0);
  // Un guardado a la vez: autoguardado, "Guardar" y cambio de paso se encolan aquí.
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const [manualSaving, setManualSaving] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);
  // Tras un 409 no se autoguarda más hasta recargar (cerrar el aviso no lo reanuda).
  const [stalePaused, setStalePaused] = useState(false);

  /**
   * Toma la respuesta del servidor como lo guardado sin pisar lo escrito durante el guardado: los
   * campos cambiados después del envío conservan su valor (y siguen pendientes); los demás toman
   * el valor normalizado por el servidor (si no, un valor que el servidor ajusta quedaría siempre
   * pendiente y se autoguardaría sin fin).
   */
  const applySaved = (saved: RecordResponse, sent: RecordFormValues) => {
    const server = toFormValues(saved);
    const changedAfterSend = diffPaths(sent, form.getValues());
    form.reset(server, { keepDirtyValues: true });
    for (const path of diffPaths(server, form.getValues())) {
      if (changedAfterSend.some((changed) => relatedPaths(changed, path))) continue;
      form.setValue(path as Path<RecordFormValues>, valueAt(server, path) as never, { shouldDirty: true });
    }
  };

  /** Guarda una historia existente si hay cambios y el paso actual es válido. */
  const persistNow = async (lastStep: number, mode: "auto" | "manual"): Promise<PersistResult> => {
    if (!record || !form.formState.isDirty) return "unchanged";
    const valid = await form.trigger(RECORD_STEPS[step - 1].fields, { shouldFocus: mode === "manual" });
    if (!valid) return "invalid";
    const sent = structuredClone(form.getValues());
    try {
      const saved = await save.mutateAsync({ values: sent, existing: { id: record.id, version: version.current }, lastStep });
      version.current = saved.version;
      applySaved(saved, sent);
      setSavedOnce(true);
      return "ok";
    } catch (error) {
      if (problemType(error) === STALE_RECORD_TYPE) {
        setStale(true);
        setStalePaused(true);
        return "stale";
      }
      if (mode === "manual") {
        onSaveError(error, () => void goTo(lastStep));
        return "failed";
      }
      // Autoguardado: sin notificaciones; el indicador dice qué pasó.
      return applyServerFieldErrors(error, form.setError) > 0 ? "invalid" : "failed";
    }
  };

  const persist = (lastStep: number, mode: "auto" | "manual"): Promise<PersistResult> => {
    const next = queue.current.then(() => persistNow(lastStep, mode));
    queue.current = next.catch(() => undefined);
    return next;
  };

  const subscribe = useCallback(
    (onChange: () => void) => form.subscribe({ formState: { values: true }, callback: () => onChange() }),
    [form],
  );
  const autosave = useAutosave({
    enabled: record !== null && !stalePaused,
    isDirty: () => form.formState.isDirty,
    subscribe,
    save: async () => {
      const result = await persist(step, "auto");
      return result === "unchanged" ? "ok" : result;
    },
  });

  const onSaveError = (error: unknown, retry: () => void) => {
    if (problemType(error) === STALE_RECORD_TYPE) {
      setStale(true);
      return;
    }
    // Datos del paciente fijos (p. ej. otra pestaña desactualizada): reintentar no sirve.
    if (problemType(error) === PATIENT_LOCKED_TYPE) {
      toast.error(getUserFriendlyError(error));
      return;
    }
    // Cupo lleno: reintentar no sirve; se vuelve a consultar el cupo para mostrar el aviso.
    if (problemType(error) === RECORD_QUOTA_REACHED_TYPE) {
      toast.error(getUserFriendlyError(error));
      void quota.refetch();
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

  /**
   * Guarda (si hace falta) y abre `target`; `target === step` = solo guardar. Resuelve "invalid" si
   * el paso actual no pasa la validación, "failed" si el guardado falla y "ok" en otro caso. En una
   * historia existente espera al autoguardado en curso y guarda `target` como último paso.
   */
  const goTo = async (target: number): Promise<StepChange> => {
    if (record) {
      if (manualSaving) return "failed";
      autosave.cancel();
      setManualSaving(true);
      const result = await persist(target, "manual");
      setManualSaving(false);
      if (result === "invalid") return "invalid";
      if (result === "failed" || result === "stale") return "failed";
      if (result === "ok" && target === step) toast.success(`Historia ${record.recordNumber} guardada`);
      if (target !== step) showStep(target);
      return "ok";
    }
    if (save.isPending) return "failed";
    const valid = await form.trigger(RECORD_STEPS[step - 1].fields, { shouldFocus: true });
    if (!valid) return "invalid";
    return new Promise<StepChange>((resolve) => {
      save.mutate(
        { values: form.getValues() },
        {
          onSuccess: (saved) => {
            form.reset(toFormValues(saved));
            allowNextNavigation();
            navigate(recordPath(saved.id, target === step ? 2 : target), { replace: true });
            resolve("ok");
          },
          onError: (error) => {
            onSaveError(error, () => void goTo(target));
            resolve("failed");
          },
        },
      );
    });
  };

  /** Desde el panel de pasos (celular): el paso actual tiene errores; enfocar el primero y avisar. */
  const onInvalidStep = () => {
    const first = errorPaths(form.formState.errors)[0];
    if (first) form.setFocus(first as Parameters<typeof form.setFocus>[0]);
    toast.error("Corrige los campos marcados del paso actual antes de cambiar de paso.");
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
  // Deshabilita la navegación solo en guardados pedidos por el usuario (no en el autoguardado).
  const saving = record ? manualSaving : save.isPending;

  return (
    <FormProvider {...form}>
      <section aria-labelledby="record-title" className="flex flex-col gap-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <RecordsBackLink />
            <h1 id="record-title" className="text-2xl font-bold">
              {record ? `Historia ${record.recordNumber}` : "Nueva historia clínica"}
            </h1>
            <p className="text-muted-foreground">
              {record ? record.patientName : "Completa al menos el nombre del paciente para crearla."}
            </p>
            {record ? (
              <RecordSaveStatus status={autosave.status} dirty={dirty} savedOnce={savedOnce} onRetry={autosave.retry} />
            ) : null}
          </div>
          {record && !dirty ? <RecordPrintLink id={record.id} recordNumber={record.recordNumber} /> : null}
          {record && dirty ? <RecordPrintPending /> : null}
        </header>

        {quotaLimit != null ? <FieldHint>{quotaReachedMessage(quotaLimit)}</FieldHint> : null}
        {record ? <PatientLockNotice record={record} /> : null}

        {stale ? (
          <StaleRecordBanner reloading={reloading} onReload={() => void reload()} onDismiss={() => setStale(false)} />
        ) : null}

        {/* Desde 1024 px: columna lateral de pasos + el paso; más angosto, una columna. */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-8">
          <RecordStepNav current={step} disabled={saving || !record} onSelect={goTo} onInvalid={onInvalidStep} />

          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              void goTo(step < RECORD_STEPS.length ? step + 1 : step);
            }}
            className="flex min-w-0 flex-col gap-6"
          >
            <h2 className="text-xl font-semibold">
              {current.number}. {current.title} <span className="text-sm font-normal text-muted-foreground">({current.pages})</span>
            </h2>
            <RecordStepContent step={step} recordNumber={record?.recordNumber} patientLocked={Boolean(record?.patientLockedAt)} />

            {/* En celular cabe en una fila: "Anterior" y "Siguiente" muestran solo el icono (el texto queda
                para el lector de pantalla). */}
            <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-border bg-background py-3 sm:gap-3 sm:py-4">
              <Button type="button" variant="outline" disabled={step === 1 || saving} onClick={() => void goTo(step - 1)}>
                <ArrowLeft className="size-4" aria-hidden="true" /> <span className="sr-only sm:not-sr-only">Anterior</span>
              </Button>
              <div className="flex gap-2">
                {record ? (
                  <Button type="button" variant="outline" disabled={saving || !dirty} onClick={() => void goTo(step)}>
                    <Save className="size-4" aria-hidden="true" /> Guardar
                  </Button>
                ) : null}
                {step < RECORD_STEPS.length ? (
                  <Button type="submit" disabled={saving || quotaLimit != null}>
                    {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                    {record ? <span className="sr-only sm:not-sr-only">Siguiente</span> : "Crear historia"}{" "}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                ) : null}
              </div>
            </div>
          </form>
        </div>
      </section>

      <LeaveConfirmDialog
        open={blocker.state === "blocked"}
        onStay={() => blocker.reset?.()}
        onLeave={() => blocker.proceed?.()}
      />
    </FormProvider>
  );
}
