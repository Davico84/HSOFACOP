import { Info } from "lucide-react";

/** Aviso visible de que el dashboard muestra datos estáticos, no reales. */
export function SampleDataBanner() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-lg border border-border bg-accent px-4 py-3 text-sm text-accent-foreground"
    >
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>
        <span className="font-semibold">Datos de ejemplo.</span> Estos valores son estáticos y sirven
        como punto de partida: reemplázalos por datos reales de tu proyecto.
      </p>
    </div>
  );
}
