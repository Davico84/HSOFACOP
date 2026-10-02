import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { Printer } from "lucide-react";
import { Button } from "@/modules/core/ui/button";
import { buttonVariants } from "@/modules/core/ui/button-variants";
import { recordPath } from "@/routes/paths";
import { useRecord } from "../../hooks/useRecord";
import { RecordLoading } from "../RecordLoading";
import { RecordLoadError } from "../RecordLoadError";
import { RecordNotFound } from "../RecordNotFound";
import { RecordPrintDocument } from "./RecordPrintDocument";
import { PAGE_CSS } from "./printStyle";

/**
 * Vista de impresión de una historia (fuera del shell): la carga, fuerza el tema claro mientras
 * está abierta y lanza el diálogo de impresión del navegador ("Guardar como PDF" incluido).
 */
export function RecordPrintFeature() {
  const { id: param } = useParams();
  const id = param && /^\d+$/.test(param) ? Number(param) : null;
  const record = useRecord(id);
  const ready = record.isSuccess;

  // El papel es claro: se quita el tema oscuro mientras la vista está abierta.
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.remove("dark");
    return () => {
      if (wasDark) root.classList.add("dark");
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(timer);
  }, [ready]);

  if (id === null) return <RecordNotFound />;
  if (record.isPending) return <div className="p-6"><RecordLoading /></div>;
  if (record.isError) {
    return (
      <div className="p-6">
        {record.error instanceof AxiosError && record.error.response?.status === 404 ? (
          <RecordNotFound />
        ) : (
          <RecordLoadError error={record.error} onRetry={() => void record.refetch()} />
        )}
      </div>
    );
  }

  return (
    <main className="min-h-dvh bg-muted print:bg-background">
      <style>{PAGE_CSS}</style>
      <div className="flex items-center justify-between gap-3 border-b border-border bg-background px-6 py-3 print:hidden">
        <Link to={recordPath(record.data.id)} className={buttonVariants({ variant: "outline", size: "sm" })}>
          Volver a la historia
        </Link>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden="true" /> Imprimir
        </Button>
      </div>
      <RecordPrintDocument record={record.data} />
    </main>
  );
}
