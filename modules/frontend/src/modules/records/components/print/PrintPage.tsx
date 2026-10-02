import type { ReactNode } from "react";
import logoAeo from "@/assets/records/logo-aeo.png";
import logoFacop from "@/assets/records/logo-facop.webp";
import { cn } from "@/modules/core/utils/cn";
import { PrintTitle } from "./PrintTitle";

interface PrintPageProps {
  recordNumber: string;
  /** Título de la sección (como en el PDF); la primera hoja no lo lleva. */
  title?: string;
  /** Primera hoja: logos grandes a la izquierda y la cabecera junto a ellos (pág. 1 del PDF). */
  first?: boolean;
  children: ReactNode;
}

/**
 * Hoja A4 de la historia impresa, con la composición del PDF: en la primera, logos grandes y
 * "HISTORIA CLÍNICA ORTODONCIA Nro." en 14 pt; en las demás, logos pequeños en la esquina
 * superior derecha (dentro del margen). La hoja se ve igual en pantalla y en papel (la página
 * impresa no tiene margen propio, ver `PAGE_CSS`); cada sección empieza en hoja nueva.
 */
export function PrintPage({ recordNumber, title, first = false, children }: PrintPageProps) {
  return (
    <article
      className={cn(
        // Misma hoja en pantalla y en papel: 210 mm de ancho con los márgenes del PDF por dentro.
        // Si un texto largo pasa a otra hoja, los márgenes se repiten en la continuación.
        "relative mx-auto box-border w-[210mm] min-h-[296mm] bg-background pt-[20mm] pr-[24mm] pb-[20mm] pl-[25mm] shadow-md",
        "[box-decoration-break:clone] [-webkit-box-decoration-break:clone]",
        "print:m-0 print:shadow-none",
        !first && "print:break-before-page",
      )}
    >
      {first ? (
        <header className="mb-[14pt] flex items-end gap-[6mm]">
          <div className="flex w-[34mm] shrink-0 flex-col items-center gap-[1mm]">
            <img src={logoAeo} alt="AEO — Escuela de Post-grado Altos Estudios en Odontología" className="w-full" />
            <img src={logoFacop} alt="FACOP — Faculdade do Centro Oeste Paulista" className="w-[28mm]" />
          </div>
          <p className="text-[14pt] leading-tight">
            HISTORIA CLÍNICA ORTODONCIA Nro.{" "}
            <span className="inline-block min-w-[30mm] border-b border-foreground px-1 text-center">{recordNumber}</span>
          </p>
        </header>
      ) : (
        <header className="absolute top-[2mm] right-[8mm] flex w-[19mm] flex-col items-center gap-[0.5mm]">
          <img src={logoAeo} alt="AEO — Escuela de Post-grado Altos Estudios en Odontología" className="w-full" />
          <img src={logoFacop} alt="FACOP — Faculdade do Centro Oeste Paulista" className="w-[16mm]" />
          <span className="sr-only">HISTORIA CLÍNICA ORTODONCIA Nro. {recordNumber}</span>
        </header>
      )}
      {title ? <PrintTitle>{title}</PrintTitle> : null}
      <div className="flex flex-col">{children}</div>
    </article>
  );
}
