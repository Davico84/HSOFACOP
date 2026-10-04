import { useEffect, useRef } from "react";
import { cn } from "@/modules/core/utils/cn";
import { RECORD_STEPS } from "../config/recordSteps";

interface RecordStepperProps {
  current: number;
  disabled: boolean;
  onSelect: (step: number) => void;
}

/**
 * Indicador de los 8 pasos; cada paso se puede abrir directamente (guarda antes si hay cambios).
 * El paso actual se desplaza a la vista. En celular la tira muestra solo los números (el título
 * queda para el lector de pantalla) y arriba se lee "Paso N de 8 · título".
 */
export function RecordStepper({ current, disabled, onSelect }: RecordStepperProps) {
  const activeRef = useRef<HTMLButtonElement>(null);
  const active = RECORD_STEPS[current - 1];

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? true;
    activeRef.current?.scrollIntoView?.({ inline: "center", block: "nearest", behavior: reduced ? "auto" : "smooth" });
  }, [current]);

  return (
    <nav aria-label="Pasos de la historia clínica" className="flex flex-col gap-2">
      <p className="text-sm font-medium sm:hidden" aria-hidden="true">
        Paso {current} de {RECORD_STEPS.length} · {active?.title}
      </p>
      <ol className="flex gap-1 overflow-x-auto pb-1">
        {RECORD_STEPS.map((step) => {
          const isActive = step.number === current;
          return (
            <li key={step.number} className="shrink-0">
              <button
                ref={isActive ? activeRef : undefined}
                type="button"
                disabled={disabled}
                aria-current={isActive ? "step" : undefined}
                onClick={() => onSelect(step.number)}
                className={cn(
                  "flex items-center gap-2 rounded-md border border-border px-2 py-2 text-left text-sm transition-colors sm:px-3",
                  "hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
                  isActive && "border-primary bg-primary/10 font-semibold",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border border-border text-xs tabular-nums",
                    isActive && "border-primary bg-primary text-primary-foreground",
                  )}
                  aria-hidden="true"
                >
                  {step.number}
                </span>
                <span className="sr-only whitespace-nowrap sm:not-sr-only">{step.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
