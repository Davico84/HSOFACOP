import type { ReactNode } from "react";
import type { ChoiceOption } from "@/modules/core/components/form/choiceTypes";
import { cn } from "@/modules/core/utils/cn";
import { ROW_LEADING } from "./printStyle";

interface PrintChoiceProps {
  label?: ReactNode;
  options: readonly ChoiceOption[];
  /** Valor elegido (única) o valores (múltiple). */
  value: string | readonly string[] | null | undefined;
  /** Texto tras las opciones (p. ej. "(lado: Izquierdo)"). */
  suffix?: ReactNode;
  /** Etiqueta en su propio renglón y opciones debajo, como en las preguntas numeradas del PDF. */
  stacked?: boolean;
}

/** Todas las opciones, con la elegida marcada: "☒ Mesofacial ☐ Dolicofacial ☐ Braquifacial". */
export function PrintChoice({ label, options, value, suffix, stacked = false }: PrintChoiceProps) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const items = (
    <>
      {options.map((o) => (
        <span key={o.value} className="whitespace-nowrap">
          <span aria-hidden="true">{selected.includes(o.value) ? "☒" : "☐"}</span>{" "}
          <span className="sr-only">{selected.includes(o.value) ? "(marcado) " : "(sin marcar) "}</span>
          {o.label}
        </span>
      ))}
      {suffix ? <span>{suffix}</span> : null}
    </>
  );
  if (stacked) {
    return (
      <div className={ROW_LEADING}>
        {label ? <p>{label}</p> : null}
        <p className="flex flex-wrap gap-x-[14pt]">{items}</p>
      </div>
    );
  }
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-[10pt]", ROW_LEADING)}>
      {label ? <span>{label}</span> : null}
      {items}
    </p>
  );
}
