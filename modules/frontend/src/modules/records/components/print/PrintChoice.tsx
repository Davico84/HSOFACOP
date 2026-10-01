import type { ReactNode } from "react";
import type { ChoiceOption } from "@/modules/core/components/form/choiceTypes";

interface PrintChoiceProps {
  label?: ReactNode;
  options: readonly ChoiceOption[];
  /** Valor elegido (única) o valores (múltiple). */
  value: string | readonly string[] | null | undefined;
  /** Texto tras la opción elegida (p. ej. "lado: Izquierdo"). */
  suffix?: ReactNode;
}

/** Todas las opciones, con la elegida marcada: "☒ Mesofacial ☐ Dolicofacial ☐ Braquifacial". */
export function PrintChoice({ label, options, value, suffix }: PrintChoiceProps) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  return (
    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
      {label ? <span>{label}</span> : null}
      {options.map((o) => (
        <span key={o.value} className="whitespace-nowrap">
          <span aria-hidden="true">{selected.includes(o.value) ? "☒" : "☐"}</span>{" "}
          <span className="sr-only">{selected.includes(o.value) ? "(marcado) " : "(sin marcar) "}</span>
          {o.label}
        </span>
      ))}
      {suffix ? <span>{suffix}</span> : null}
    </p>
  );
}
