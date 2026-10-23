import type { WolfordAnalysis } from "@/modules/core/services/generated/model";
import { boltonWidth, type BoltonSources } from "../config/bolton";
import { roundHalfAway, suggestedSum, tenths, type SuggestedSum } from "./suggestedSum";

/** Piezas de cada suma de Wolford, de derecha a izquierda del paciente (convención de Bolton). */
export const WOLFORD_TEETH = {
  upper12Sum: [16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26],
  lower12Sum: [46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36],
  upper6Sum: [13, 12, 11, 21, 22, 23],
  lower6Sum: [43, 42, 41, 31, 32, 33],
} as const satisfies Record<WolfordSumKey, readonly number[]>;

export type WolfordSumKey = keyof Pick<WolfordAnalysis, "upper12Sum" | "lower12Sum" | "upper6Sum" | "lower6Sum">;

export const WOLFORD_SUM_KEYS = ["upper12Sum", "lower12Sum", "upper6Sum", "lower6Sum"] as const;

/**
 * Suma sugerida: incisivos y primeros molares de Bolton, caninos y premolares de Nance (las mismas
 * piezas compartidas de Bolton).
 */
export function wolfordSuggestedSum(models: BoltonSources | null | undefined, key: WolfordSumKey): SuggestedSum {
  return suggestedSum(WOLFORD_TEETH[key].map((tooth) => boltonWidth(models, tooth)));
}

export interface WolfordResult {
  /** Suma 12 max − suma 12 mand × 1,1. */
  total: number | null;
  /** Suma 6 max − suma 6 mand × 1,3. */
  partial: number | null;
}

/**
 * Discrepancia en mm con un decimal (la mitad alejándose de cero). En centésimas: décimas × 10 y
 * décimas × 11 / × 13, sin errores de coma flotante. Sin una de sus dos sumas, `null`.
 */
const discrepancy = (upper: number | null, lower: number | null, factorTenths: number) =>
  upper === null || lower === null ? null : roundHalfAway((tenths(upper) * 10 - tenths(lower) * factorTenths) / 10) / 10;

export function wolfordResult(sums: Record<WolfordSumKey, number | null>): WolfordResult {
  return {
    total: discrepancy(sums.upper12Sum, sums.lower12Sum, 11),
    partial: discrepancy(sums.upper6Sum, sums.lower6Sum, 13),
  };
}
