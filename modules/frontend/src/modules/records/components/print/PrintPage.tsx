import type { ReactNode } from "react";
import logoAeo from "@/assets/records/logo-aeo.png";
import logoFacop from "@/assets/records/logo-facop.webp";

interface PrintPageProps {
  recordNumber: string;
  /** Título de la sección (como en el PDF); la primera página no lo repite. */
  title?: string;
  /** La primera hoja no fuerza salto de página antes. */
  first?: boolean;
  children: ReactNode;
}

/**
 * Hoja A4 de la historia impresa: logos AEO/FACOP y "HISTORIA CLÍNICA ORTODONCIA Nro." arriba,
 * y salto de página antes de cada sección (como el PDF).
 */
export function PrintPage({ recordNumber, title, first = false, children }: PrintPageProps) {
  return (
    <article className={first ? "print-sheet" : "print-sheet print:break-before-page"}>
      <header className="mb-4 flex items-end justify-between gap-4 border-b border-foreground pb-2">
        <div className="flex items-center gap-3">
          <img src={logoAeo} alt="AEO — Escuela de Post-grado Altos Estudios en Odontología" className="h-10 w-auto" />
          <img src={logoFacop} alt="FACOP — Faculdade do Centro Oeste Paulista" className="h-8 w-auto" />
        </div>
        <p className="text-sm">
          HISTORIA CLÍNICA ORTODONCIA Nro. <span className="border-b border-foreground px-2 font-semibold">{recordNumber}</span>
        </p>
      </header>
      {title ? <h2 className="mb-2 text-sm font-bold uppercase">{title}</h2> : null}
      <div className="flex flex-col gap-1.5">{children}</div>
    </article>
  );
}
