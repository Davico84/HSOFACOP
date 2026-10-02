import type { ReactNode } from "react";
import type { ChoiceOption } from "@/modules/core/components/form/choiceTypes";
import { cn } from "@/modules/core/utils/cn";
import { ROW_LEADING } from "./printStyle";
import { fitsInOneRow } from "./printLayout";

interface PrintChoiceProps {
  label?: ReactNode;
  options: readonly ChoiceOption[];
  /** Valor elegido (única) o valores (múltiple). */
  value: string | readonly string[] | null | undefined;
  /** Texto tras las opciones (p. ej. "(lado: Izquierdo)"). */
  suffix?: ReactNode;
  /** Fuerza una opción por renglón aunque quepan juntas. */
  vertical?: boolean;
}

/** Una pregunta que termina en ":" lleva sus opciones en el renglón siguiente. */
function endsWithColon(label: ReactNode): boolean {
  return typeof label === "string" && label.trim().endsWith(":");
}

/**
 * Todas las opciones, con la elegida marcada: "☒ Mesofacial ☐ Dolicofacial ☐ Braquifacial".
 * Regla de la hoja impresa (revisada con el usuario):
 * - si la pregunta termina en ":", las opciones van en el renglón siguiente;
 * - si las opciones caben en un renglón (Presenta / No presenta, Sí / No…), van juntas;
 *   si no caben, una por renglón (nunca se parten a mitad de la lista).
 */
export function PrintChoice({ label, options, value, suffix, vertical = false }: PrintChoiceProps) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const column = vertical || !fitsInOneRow(options, suffix);
  const option = (o: ChoiceOption) => (
    <span key={o.value} className="whitespace-nowrap">
      <span aria-hidden="true">{selected.includes(o.value) ? "☒" : "☐"}</span>{" "}
      <span className="sr-only">{selected.includes(o.value) ? "(marcado) " : "(sin marcar) "}</span>
      {o.label}
    </span>
  );
  const list = column ? (
    <div className="flex flex-col">
      {options.map((o) => (
        <p key={o.value}>{option(o)}</p>
      ))}
      {suffix ? <p>{suffix}</p> : null}
    </div>
  ) : (
    <p className="flex gap-x-[14pt]">
      {options.map(option)}
      {suffix ? <span>{suffix}</span> : null}
    </p>
  );

  if (label && (endsWithColon(label) || column)) {
    return (
      <div className={ROW_LEADING}>
        <p>{label}</p>
        {list}
      </div>
    );
  }
  return (
    <div className={cn("flex items-baseline gap-x-[10pt]", ROW_LEADING)}>
      {label ? <span className="shrink-0">{label}</span> : null}
      {list}
    </div>
  );
}
