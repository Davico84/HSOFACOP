import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/modules/core/utils/cn";
import { fitScale } from "@/modules/core/utils/fitScale";

interface ScaleToFitProps {
  /** Ancho natural del contenido, en px (p. ej. una hoja A4: 210 mm = 794 px). */
  naturalWidth: number;
  children: ReactNode;
  className?: string;
}

/**
 * Reduce su contenido para que quepa en el ancho disponible, sin desplazamiento horizontal (p. ej.
 * las hojas A4 de la vista previa en celular). Usa `zoom`, que a diferencia de `transform` reduce
 * también el alto. Al imprimir no escala: el contenido sale en su tamaño real.
 */
export function ScaleToFit({ naturalWidth, children, className }: ScaleToFitProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      // Ancho del contenido: sin el padding de la caja.
      const style = getComputedStyle(el);
      const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      setScale(fitScale(el.clientWidth - (Number.isNaN(padding) ? 0 : padding), naturalWidth));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [naturalWidth]);

  return (
    <div ref={ref} className={cn("w-full overflow-x-hidden print:overflow-visible", className)} data-scale={scale}>
      <div style={{ zoom: scale }} className="print:[zoom:1]!">
        {children}
      </div>
    </div>
  );
}
