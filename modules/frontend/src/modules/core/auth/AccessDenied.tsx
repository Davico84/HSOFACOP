import { useEffect, useId, useRef } from "react";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/modules/core/ui/button-variants";
import { cn } from "@/modules/core/utils/cn";
import { PATHS } from "@/routes/paths";

interface AccessDeniedProps {
  /**
   * Dentro del shell (bajo `AppLayout`, que ya aporta el único `<main>`): sección sin alto de
   * pantalla completa, que recibe el foco al montarse para que el lector de pantalla anuncie
   * el estado tras navegar. Sin `embedded`: pantalla completa (fuera del shell).
   */
  embedded?: boolean;
}

/** Estado de acceso denegado (rol sin permiso) con opción de volver. */
export function AccessDenied({ embedded = false }: AccessDeniedProps) {
  const titleId = useId();
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (embedded) sectionRef.current?.focus();
  }, [embedded]);

  const content = (
    <>
      <h1 id={titleId} className="text-2xl font-bold">
        Acceso denegado
      </h1>
      <p className="max-w-sm text-muted-foreground">No tienes permiso para ver esta página.</p>
      <Link to={PATHS.ROOT} className={cn(buttonVariants({ variant: "outline" }))}>
        Volver al inicio
      </Link>
    </>
  );

  if (embedded) {
    return (
      <section
        ref={sectionRef}
        tabIndex={-1}
        aria-labelledby={titleId}
        className="flex flex-col items-center justify-center gap-3 py-16 text-center outline-hidden"
      >
        {content}
      </section>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-4 text-center">
      {content}
    </main>
  );
}
