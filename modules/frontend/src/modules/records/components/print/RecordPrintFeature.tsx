import { useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { AxiosError } from "axios";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/modules/core/ui/button";
import { buttonVariants } from "@/modules/core/ui/button-variants";
import { ScaleToFit } from "@/modules/core/components/ScaleToFit";
import { recordPath } from "@/routes/paths";
import { useRecord } from "../../hooks/useRecord";
import { RecordLoading } from "../RecordLoading";
import { RecordLoadError } from "../RecordLoadError";
import { RecordNotFound } from "../RecordNotFound";
import { RecordPrintDocument } from "./RecordPrintDocument";
import { PAGE_CSS, SHEET_WIDTH_PX } from "./printStyle";

/**
 * Vista preliminar de impresión de una historia (fuera del shell): muestra las hojas A4 tal como
 * saldrán y el diálogo de impresión del navegador ("Guardar como PDF" incluido) se abre solo al
 * pulsar "Imprimir", después de revisarlas. Fuerza el tema claro mientras está abierta.
 */
export function RecordPrintFeature() {
  const { id: param } = useParams();
  const id = param && /^\d+$/.test(param) ? Number(param) : null;
  const record = useRecord(id);
  // De dónde se abrió la vista (listado con su búsqueda o paso del formulario); si no, la historia.
  const returnTo = (useLocation().state as { returnTo?: string } | null)?.returnTo;

  // El papel es claro: se quita el tema oscuro mientras la vista está abierta.
  useEffect(() => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.remove("dark");
    return () => {
      if (wasDark) root.classList.add("dark");
    };
  }, []);

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
      {/* En celular: "Volver" e "Imprimir" en una fila y la ayuda debajo. */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border bg-background px-4 py-3 sm:px-6 print:hidden">
        <Link to={returnTo ?? recordPath(record.data.id)} className={buttonVariants({ variant: "outline", size: "sm" })}>
          <ArrowLeft className="size-4" aria-hidden="true" /> Volver
        </Link>
        <Button onClick={() => window.print()} className="sm:order-last">
          <Printer className="size-4" aria-hidden="true" /> Imprimir
        </Button>
        <p className="w-full text-sm text-muted-foreground sm:w-auto sm:flex-1">
          Vista preliminar de la historia {record.data.recordNumber}: revisa las hojas y pulsa Imprimir.
        </p>
      </div>
      {/* Las hojas miden 210 mm: en pantallas más angostas se reducen para caber (al imprimir, A4 real). */}
      <ScaleToFit naturalWidth={SHEET_WIDTH_PX} className="px-2 sm:px-6 print:px-0">
        <RecordPrintDocument record={record.data} />
      </ScaleToFit>
    </main>
  );
}
