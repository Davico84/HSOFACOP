import { useEffect, useState } from "react";

/** Espera tras el último cambio antes de autoguardar. */
export const AUTOSAVE_DELAY_MS = 3_000;
/** Mínimo entre dos autoguardados (salvo al ocultar la pestaña). */
export const AUTOSAVE_MIN_INTERVAL_MS = 10_000;

export type AutosaveStatus = "idle" | "saving" | "saved" | "invalid" | "failed";
export type AutosaveResult = "ok" | "invalid" | "failed" | "stale";

interface AutosaveInput {
  /** Falso para una historia nueva o tras un 409 (hasta recargar). */
  enabled: boolean;
  /** Hay cambios sin guardar. */
  isDirty: () => boolean;
  /** Guarda sin notificaciones (el llamador serializa los guardados). */
  save: () => Promise<AutosaveResult>;
}

interface UseAutosaveOptions extends AutosaveInput {
  /** Se suscribe a los cambios del formulario; devuelve la función para cancelar la suscripción. */
  subscribe: (onChange: () => void) => () => void;
}

/**
 * Temporizador y estado del autoguardado, fuera de React: se crea una vez por formulario y recibe
 * en cada render lo último (`update`), así el temporizador nunca usa valores viejos.
 */
function createAutosave(setStatus: (status: AutosaveStatus) => void) {
  let input: AutosaveInput = { enabled: false, isDirty: () => false, save: async () => "ok" };
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let again = false;
  let lastSavedAt = 0;

  const cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  const run = async (): Promise<void> => {
    cancel();
    if (!input.enabled || !input.isDirty()) return;
    if (running) {
      again = true;
      return;
    }
    running = true;
    setStatus("saving");
    const result = await input.save();
    running = false;
    lastSavedAt = Date.now();
    setStatus(result === "ok" ? "saved" : result === "stale" ? "idle" : result);
    if (again) {
      again = false;
      schedule();
    }
  };

  function schedule() {
    if (!input.enabled) return;
    if (running) {
      again = true;
      return;
    }
    cancel();
    const wait = Math.max(AUTOSAVE_DELAY_MS, lastSavedAt + AUTOSAVE_MIN_INTERVAL_MS - Date.now());
    timer = setTimeout(() => void run(), wait);
  }

  return {
    update: (next: AutosaveInput) => {
      input = next;
    },
    run,
    schedule,
    cancel,
  };
}

/**
 * Autoguardado de la historia: a los 3 s del último cambio, como mucho cada 10 s, y de inmediato
 * al ocultarse la pestaña (cambio de app o pantalla bloqueada en el celular, donde el aviso de
 * salida no es fiable). Un guardado a la vez; un cambio que llega durante el guardado se guarda
 * después. Si falla, se reintenta al editar de nuevo o al recuperar la conexión.
 */
export function useAutosave({ enabled, isDirty, save, subscribe }: UseAutosaveOptions) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [autosave] = useState(() => createAutosave(setStatus));

  useEffect(() => {
    autosave.update({ enabled, isDirty, save });
  });

  // Cada cambio del formulario reprograma el guardado.
  useEffect(() => {
    if (!enabled) return;
    const unsubscribe = subscribe(autosave.schedule);
    return () => {
      unsubscribe();
      autosave.cancel();
    };
  }, [enabled, subscribe, autosave]);

  // Ocultar la pestaña o salir de la página: guardar ya. Volver la conexión: reintentar.
  useEffect(() => {
    if (!enabled) return;
    const onHidden = () => {
      if (document.visibilityState === "hidden") void autosave.run();
    };
    const onLeave = () => void autosave.run();
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", onLeave);
    window.addEventListener("online", onLeave);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", onLeave);
      window.removeEventListener("online", onLeave);
    };
  }, [enabled, autosave]);

  return { status, retry: () => void autosave.run(), cancel: autosave.cancel };
}
