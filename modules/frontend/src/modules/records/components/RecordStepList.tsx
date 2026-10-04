import { Circle, CircleAlert, CircleCheck } from "lucide-react";
import { Progress } from "@/modules/core/ui/progress";
import { cn } from "@/modules/core/utils/cn";
import { RECORD_STEPS } from "../config/recordSteps";
import type { StepStatus, StepStatusResult } from "../hooks/useStepStatus";

interface RecordStepListProps {
  current: number;
  disabled: boolean;
  status: StepStatusResult;
  onSelect: (step: number) => void;
}

const STATUS: Record<StepStatus, { label: string; icon: typeof Circle; className: string }> = {
  error: { label: "con errores", icon: CircleAlert, className: "text-destructive" },
  filled: { label: "con datos", icon: CircleCheck, className: "text-success" },
  empty: { label: "vacío", icon: Circle, className: "text-muted-foreground" },
};

/**
 * Los 8 pasos con su estado (con errores > con datos > vacío) y el progreso general. Se usa en la
 * columna lateral (escritorio) y en el panel de celular. El estado se anuncia con un texto oculto
 * dentro del botón (sin `aria-label`, que reemplazaría el texto visible) y su ícono es decorativo.
 */
export function RecordStepList({ current, disabled, status, onSelect }: RecordStepListProps) {
  const percent = Math.round((status.withData / RECORD_STEPS.length) * 100);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">{status.progressText}</span>
        <Progress value={percent} aria-label="Progreso de la historia" aria-valuetext={status.progressText} />
      </div>
      <ol className="flex flex-col gap-1">
        {RECORD_STEPS.map((step) => {
          const { status: state } = status.steps[step.number];
          const { label, icon: Icon, className } = STATUS[state];
          const active = step.number === current;
          return (
            <li key={step.number}>
              <button
                type="button"
                disabled={disabled}
                aria-current={active ? "step" : undefined}
                onClick={() => onSelect(step.number)}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-md border border-transparent px-2.5 py-2 text-left text-sm transition-colors",
                  "hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
                  active && "border-primary/50 bg-primary/10",
                  state === "error" && "border-destructive/50",
                )}
              >
                <span
                  className={cn(
                    "mt-px flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-xs tabular-nums",
                    active && "border-primary bg-primary text-primary-foreground",
                  )}
                >
                  {step.number}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className={cn("leading-snug", active && "font-semibold")}>{step.title}</span>
                  <span className="text-xs text-muted-foreground">{step.pages}</span>
                </span>
                <Icon className={cn("mt-0.5 size-4 shrink-0", className)} aria-hidden="true" />
                <span className="sr-only"> · {label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
