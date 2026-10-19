import { useRef, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/modules/core/ui/tooltip";
import { cn } from "@/modules/core/utils/cn";

interface TruncatedTextProps {
  text: string;
  className?: string;
}

/**
 * Texto de una línea que se corta con "…" si no cabe y, solo entonces, muestra el texto completo en
 * un tooltip al pasar el ratón. El texto completo sigue en el DOM (el lector de pantalla lo lee
 * entero); el contenedor debe limitar el ancho (`min-w-0`/`max-w-*`).
 */
export function TruncatedText({ text, className }: TruncatedTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = useState(false);

  const measure = () => {
    const el = ref.current;
    if (el) setTruncated(el.scrollWidth > el.clientWidth);
  };

  return (
    <Tooltip open={truncated ? undefined : false}>
      <TooltipTrigger asChild>
        <span ref={ref} onPointerEnter={measure} className={cn("block truncate", className)}>
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm break-all">{text}</TooltipContent>
    </Tooltip>
  );
}
