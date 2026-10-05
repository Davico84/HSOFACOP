import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/modules/core/utils/cn";

interface ScrollableXProps {
  children: ReactNode;
  className?: string;
}

/**
 * Caja con desplazamiento horizontal para tablas que no caben (celular): muestra un degradado en el
 * borde por donde queda contenido y lo oculta al llegar al extremo. La tabla de adentro puede fijar
 * su primera columna con `sticky left-0` y fondo.
 */
export function ScrollableX({ children, className }: ScrollableXProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const start = el.scrollLeft > 1;
    const end = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      observer?.disconnect();
    };
  }, [measure]);

  const fade = "pointer-events-none absolute inset-y-0 w-6 from-background to-transparent transition-opacity";
  return (
    <div className={cn("relative", className)} data-more-start={edges.start || undefined} data-more-end={edges.end || undefined}>
      <div ref={ref} className="overflow-x-auto">
        {children}
      </div>
      <div aria-hidden="true" className={cn(fade, "left-0 bg-linear-to-r", edges.start ? "opacity-100" : "opacity-0")} />
      <div aria-hidden="true" className={cn(fade, "right-0 bg-linear-to-l", edges.end ? "opacity-100" : "opacity-0")} />
    </div>
  );
}
