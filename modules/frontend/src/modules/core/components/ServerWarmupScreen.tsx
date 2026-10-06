import { useEffect, useRef } from "react";
import { Clock, LoaderCircle, Sunrise, WifiOff } from "lucide-react";
import { BrandPanel } from "@/modules/core/components/BrandPanel";
import { ContactLinks } from "@/modules/core/components/ContactLinks";
import { project } from "@/config/project";
import { Button } from "@/modules/core/ui/button";
import { Logo } from "@/modules/core/ui/logo";
import { Progress } from "@/modules/core/ui/progress";
import { cn } from "@/modules/core/utils/cn";
import { ALMOST_AFTER_S, estimatedProgress, warmupStage } from "@/modules/core/utils/serverWarmup";

interface ServerWarmupScreenProps {
  /** Segundos que lleva la espera al backend. */
  elapsedSeconds: number;
  /** Si el navegador tiene conexión. */
  online: boolean;
  /** Reintentar (recargar). También se llama solo al volver la conexión. */
  onRetry: () => void;
}

const COPY = {
  warming: {
    title: "Preparando tu consultorio digital",
    lead: "Estamos preparando tu consultorio digital para iniciar el día, esto puede tomar un minuto…",
  },
  stuck: {
    title: "Está tardando más de lo normal",
    lead: "El servidor todavía no responde. Puedes seguir esperando o volver a intentarlo.",
  },
  offline: {
    title: "Sin conexión a internet",
    lead: "Revisa tu wifi o tus datos móviles. Volveremos a intentarlo solos cuando regrese la conexión.",
  },
} as const;

/**
 * Pantalla mientras la app espera al backend al cargar (arranque en frío del servidor gratuito).
 * Hasta 4 s solo "Cargando…"; luego "Preparando…" con una barra **estimada**; desde 90 s ofrece
 * reintentar; sin red, un aviso propio. La región `status` cambia solo con la etapa (no con cada
 * tic de la barra), así el lector de pantalla la anuncia una vez.
 */
export function ServerWarmupScreen({ elapsedSeconds, online, onRetry }: ServerWarmupScreenProps) {
  const stage = warmupStage(elapsedSeconds, online);
  const hasContact = Boolean(project.contact?.whatsapp || project.contact?.email);
  const retryArea = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (stage === "stuck") retryArea.current?.querySelector("button")?.focus();
  }, [stage]);

  // Al volver la red, reintenta solo (la espera previa pudo fallar sin conexión).
  useEffect(() => {
    if (online) return undefined;
    window.addEventListener("online", onRetry);
    return () => window.removeEventListener("online", onRetry);
  }, [online, onRetry]);

  if (stage === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-muted-foreground">
        <LoaderCircle aria-hidden="true" className="size-6 animate-spin text-primary motion-reduce:animate-none" />
        Cargando…
      </div>
    );
  }

  const copy = COPY[stage];
  const Icon = stage === "offline" ? WifiOff : stage === "stuck" ? Clock : Sunrise;
  const progress = estimatedProgress(elapsedSeconds);

  return (
    <div className="grid min-h-screen bg-background text-foreground lg:grid-cols-2">
      <BrandPanel />
      <main className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm text-center">
          <div className="mb-10 flex justify-center lg:hidden">
            <Logo className="h-12 w-auto" />
          </div>

          <div role="status" aria-live="polite">
            <div
              aria-hidden="true"
              className={cn(
                "mx-auto mb-5 grid size-14 place-items-center rounded-full",
                stage === "warming" && "bg-secondary text-secondary-foreground",
                stage === "stuck" && "bg-warning/15 text-warning",
                stage === "offline" && "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="size-7" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
            <p className="mt-2 text-balance text-muted-foreground">{copy.lead}</p>
          </div>

          {stage !== "offline" ? (
            <Progress
              value={progress}
              aria-label="Preparando el servidor"
              className="mt-8 [&_[data-slot=progress-indicator]]:duration-700 motion-reduce:[&_[data-slot=progress-indicator]]:transition-none"
            />
          ) : null}

          {stage === "warming" ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {elapsedSeconds < ALMOST_AFTER_S
                ? "Esto suele tardar menos de un minuto. No cierres esta pestaña: continuará sola."
                : "Ya casi está…"}
            </p>
          ) : null}

          {stage === "stuck" || stage === "offline" ? (
            <div ref={retryArea} className="mt-8 flex justify-center">
              <Button variant={stage === "stuck" ? "default" : "outline"} onClick={onRetry}>
                {stage === "stuck" ? "Reintentar" : "Reintentar ahora"}
              </Button>
            </div>
          ) : null}

          {stage === "stuck" ? (
            hasContact ? (
              <div className="mt-6 flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">Si el problema continúa, escríbenos:</p>
                <ContactLinks title={null} />
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Si el problema continúa, avisa al administrador.</p>
            )
          ) : null}
        </div>
      </main>
    </div>
  );
}
