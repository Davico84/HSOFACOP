import { useRef, useState } from "react";
import { ListOrdered } from "lucide-react";
import { useMediaQuery } from "@/modules/core/hooks/useMediaQuery";
import { buttonVariants } from "@/modules/core/ui/button-variants";
import { Progress } from "@/modules/core/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/modules/core/ui/sheet";
import { RECORD_STEPS } from "../config/recordSteps";
import { useStepStatus } from "../hooks/useStepStatus";
import { RecordStepList } from "./RecordStepList";

/** Resultado de intentar cambiar de paso (ver `RecordForm.goTo`). */
export type StepChange = "ok" | "invalid" | "failed";

interface RecordStepNavProps {
  current: number;
  disabled: boolean;
  onSelect: (step: number) => Promise<StepChange>;
  /** El paso actual tiene campos inválidos: enfocar el primero y avisar. */
  onInvalid: () => void;
}

const TITLE = "Pasos de la historia clínica";

/**
 * Navegación entre los 8 pasos con su estado y el progreso. Desde 1024 px, columna lateral fija;
 * más angosto, encabezado "Paso N de 8" con un botón que abre la lista en un panel. Es el único
 * lugar que usa `useStepStatus` (vigila todo el formulario sin redibujarlo).
 */
export function RecordStepNav({ current, disabled, onSelect, onInvalid }: RecordStepNavProps) {
  const desktop = useMediaQuery("(min-width: 1024px)", true);
  const status = useStepStatus();
  const [open, setOpen] = useState(false);
  // Si la validación falla, el foco va al campo inválido cuando el panel termina de cerrarse.
  const pendingInvalid = useRef(false);
  const closed = useRef(true);
  const active = RECORD_STEPS[current - 1];

  if (desktop) {
    return (
      <nav aria-label={TITLE} className="sticky top-20 max-h-[calc(100dvh-5.5rem)] overflow-y-auto pr-1">
        <RecordStepList current={current} disabled={disabled} status={status} onSelect={(n) => void onSelect(n)} />
      </nav>
    );
  }

  const choose = async (step: number) => {
    setOpen(false);
    const result = await onSelect(step);
    if (result !== "invalid") return;
    if (closed.current) onInvalid();
    else pendingInvalid.current = true;
  };

  return (
    <nav aria-label={TITLE} className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 text-sm font-medium">
          Paso {current} de {RECORD_STEPS.length} · {active?.title}
        </p>
        <Sheet
          open={open}
          onOpenChange={(next) => {
            closed.current = !next;
            setOpen(next);
          }}
        >
          <SheetTrigger disabled={disabled} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <ListOrdered className="size-4" aria-hidden="true" /> Pasos
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-80 max-w-[85vw] overflow-y-auto"
            onCloseAutoFocus={(event) => {
              // No devolver el foco al botón "Pasos": queda en el formulario (o en el campo inválido).
              event.preventDefault();
              closed.current = true;
              if (pendingInvalid.current) {
                pendingInvalid.current = false;
                onInvalid();
              }
            }}
          >
            <SheetHeader>
              <SheetTitle>{TITLE}</SheetTitle>
            </SheetHeader>
            <div className="px-4 pb-4">
              <RecordStepList current={current} disabled={disabled} status={status} onSelect={(n) => void choose(n)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <Progress
        value={Math.round((status.withData / RECORD_STEPS.length) * 100)}
        aria-label="Progreso de la historia"
        aria-valuetext={status.progressText}
      />
    </nav>
  );
}
