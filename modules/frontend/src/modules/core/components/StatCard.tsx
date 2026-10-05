import type { LucideIcon } from "lucide-react";
import { Card } from "@/modules/core/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Texto secundario opcional (tendencia, periodo…). */
  hint?: string;
}

/** Tarjeta de indicador genérica (sin dominio): etiqueta, valor e icono. */
export function StatCard({ label, value, icon: Icon, hint }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      <p className="text-3xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </Card>
  );
}
