import type { ReactNode } from "react";
import type { ChoiceOption } from "@/modules/core/components/form/choiceTypes";

/**
 * Caracteres que caben en un renglón del ancho útil del PDF (161 mm) a Arial 10 pt, contando
 * la casilla y el espacio entre opciones.
 */
const ROW_CHARS = 88;

/** ¿Caben todas las opciones (y el sufijo) en un renglón de la hoja impresa? */
export function fitsInOneRow(options: readonly ChoiceOption[], suffix?: ReactNode): boolean {
  const chars = options.reduce((n, o) => n + o.label.length + 4, 0) + (typeof suffix === "string" ? suffix.length : 0);
  return chars <= ROW_CHARS;
}
