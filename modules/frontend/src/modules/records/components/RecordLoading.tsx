import { Loader2 } from "lucide-react";

/** Cargando una historia. */
export function RecordLoading() {
  return (
    <p className="flex items-center gap-2 text-muted-foreground" role="status">
      <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Cargando historia…
    </p>
  );
}
