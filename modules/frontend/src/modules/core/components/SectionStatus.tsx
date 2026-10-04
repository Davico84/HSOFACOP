import type { ReactNode } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/modules/core/utils/cn";

/**
 * Tono del estado: `neutral` (gris), `active` (marca: p. ej. hay datos), `success` (correcto: p. ej.
 * dentro del rango) y `danger` (alerta: p. ej. fuera del rango).
 */
export type SectionStatusTone = "neutral" | "active" | "success" | "danger";

interface SectionStatusProps {
  /** Atajo de `tone="active"` (se mantiene por compatibilidad). */
  active?: boolean;
  tone?: SectionStatusTone;
  children: ReactNode;
}

const TONES: Record<SectionStatusTone, string> = {
  neutral: "border-border text-muted-foreground",
  active: "border-primary/40 bg-primary/10 text-primary",
  success: "border-success/40 bg-success/10 text-success",
  danger: "border-destructive/50 bg-destructive/10 text-destructive",
};

/**
 * Píldora de estado ("Sin datos" / "6 datos", "Dentro del rango" / "Fuera del rango"). Los tonos
 * `success` y `danger` llevan ícono para no depender solo del color.
 */
export function SectionStatus({ active = false, tone, children }: SectionStatusProps) {
  const resolved = tone ?? (active ? "active" : "neutral");
  const Icon = resolved === "danger" ? CircleAlert : resolved === "success" ? CircleCheck : null;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        resolved === "danger" && "font-semibold",
        TONES[resolved],
      )}
    >
      {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}
