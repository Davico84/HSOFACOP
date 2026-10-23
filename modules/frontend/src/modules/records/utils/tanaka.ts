import type { LowerIncisors } from "@/modules/core/services/generated/model";
import { LOWER_INCISORS } from "../config/moyers";
import { roundHalfAway, suggestedSum, tenths, type SuggestedSum } from "./suggestedSum";

type Measures<T> = { [K in keyof T]?: number | null };

/** Suma sugerida de Tanaka-Johnston: solo los incisivos inferiores de Moyers (no los de Nance ni Bolton). */
export function tanakaSuggestedSum(incisors: Measures<LowerIncisors> | null | undefined): SuggestedSum {
  return suggestedSum(LOWER_INCISORS.map(({ key }) => incisors?.[key]));
}

export interface TanakaResult {
  /** Espacio previsto para canino y premolares: suma ÷ 2 + 11. */
  maxilla: number;
  /** suma ÷ 2 + 10,5. */
  mandible: number;
}

/**
 * Espacio previsto por Tanaka-Johnston, con un decimal y la mitad hacia arriba. En vigésimas de mm
 * (suma en décimas ÷ 2) para no arrastrar errores de coma flotante. Sin suma, `null`.
 */
export function tanakaResult(sum: number | null): TanakaResult | null {
  if (sum === null) return null;
  const s = tenths(sum); // décimas; s / 2 décimas = s vigésimas
  return {
    maxilla: roundHalfAway((s + 220) / 2) / 10,
    mandible: roundHalfAway((s + 210) / 2) / 10,
  };
}
