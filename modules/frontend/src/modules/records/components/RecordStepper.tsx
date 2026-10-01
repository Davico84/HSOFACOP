import { cn } from "@/modules/core/utils/cn";
import { RECORD_STEPS } from "../config/recordSteps";

interface RecordStepperProps {
  current: number;
  disabled: boolean;
  onSelect: (step: number) => void;
}

/** Indicador de los 7 pasos; cada paso se puede abrir directamente (guarda antes si hay cambios). */
export function RecordStepper({ current, disabled, onSelect }: RecordStepperProps) {
  return (
    <nav aria-label="Pasos de la historia clínica">
      <ol className="flex gap-1 overflow-x-auto pb-1">
        {RECORD_STEPS.map((step) => {
          const active = step.number === current;
          return (
            <li key={step.number} className="shrink-0">
              <button
                type="button"
                disabled={disabled}
                aria-current={active ? "step" : undefined}
                onClick={() => onSelect(step.number)}
                className={cn(
                  "flex items-center gap-2 rounded-md border border-border px-3 py-2 text-left text-sm transition-colors",
                  "hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
                  active && "border-primary bg-primary/10 font-semibold",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border border-border text-xs tabular-nums",
                    active && "border-primary bg-primary text-primary-foreground",
                  )}
                  aria-hidden="true"
                >
                  {step.number}
                </span>
                <span className="whitespace-nowrap">{step.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
