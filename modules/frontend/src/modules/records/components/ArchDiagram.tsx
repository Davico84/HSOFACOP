import { cn } from "@/modules/core/utils/cn";
import { ARCH_MEASURE_ENDS, ARCH_MEASURE_LINE, ARCH_TEETH, ARCH_VIEWBOX } from "../config/archGeometry";
import { UPPER_NANCE_TEETH } from "../config/nance";

interface ArchDiagramProps {
  /** Hoja impresa: escala de grises (en pantalla, colores del tema). */
  print?: boolean;
  className?: string;
}

const MEASURED = new Set<number>(UPPER_NANCE_TEETH);

/**
 * Arcada superior en vista oclusal (análisis de Nance): resalta las piezas que se miden (15→25),
 * deja en gris los molares y traza la medición de mesial del 16 a mesial del 26. Ilustrativo: los
 * colores salen de los tokens del tema.
 */
export function ArchDiagram({ print = false, className }: ArchDiagramProps) {
  const tooth = (measured: boolean) =>
    measured
      ? print ? "fill-muted stroke-foreground" : "fill-primary/15 stroke-primary"
      : print ? "fill-background stroke-muted-foreground" : "fill-muted stroke-muted-foreground/60";
  const groove = (measured: boolean) => (measured && !print ? "stroke-primary/70" : "stroke-muted-foreground/70");
  const label = (measured: boolean) => (measured ? "fill-foreground font-semibold" : "fill-muted-foreground");

  return (
    <svg
      viewBox={ARCH_VIEWBOX}
      role="img"
      aria-label="Arcada superior en vista oclusal: se miden las piezas 15 a 25, de mesial del primer molar a mesial del primer molar."
      className={cn("h-auto w-full", className)}
    >
      {ARCH_TEETH.map((t) => {
        const measured = MEASURED.has(t.tooth);
        return (
          <g key={t.tooth}>
            <g transform={t.transform}>
              <path d={t.outline} strokeWidth={1.3} strokeLinejoin="round" className={tooth(measured)} />
              <path d={t.grooves} fill="none" strokeWidth={1} strokeLinecap="round" className={groove(measured)} />
            </g>
            <text x={t.label.x} y={t.label.y} textAnchor="middle" fontSize={10} className={label(measured)}>
              {t.tooth}
            </text>
          </g>
        );
      })}
      <polyline points={ARCH_MEASURE_LINE} fill="none" strokeWidth={2} strokeDasharray="5 3" className="stroke-foreground" />
      {ARCH_MEASURE_ENDS.map((p) => (
        <circle key={`${p.x}-${p.y}`} cx={p.x} cy={p.y} r={4} className="fill-foreground" />
      ))}
    </svg>
  );
}
