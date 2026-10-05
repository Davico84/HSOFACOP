import { cn } from "@/modules/core/utils/cn";
import { PrintPage } from "./PrintPage";

interface PrintEvolutionNotesSectionProps {
  recordNumber: string;
}

/** Renglones de la tabla del PDF (pág. 14). */
const EVOLUTION_ROWS = 37;

const CELL = "h-[6.25mm] border border-ink px-[2mm] align-middle";

/**
 * Pág. 14: "Notas de evolución" en blanco para llenar a mano (fecha, trabajo realizado y firma
 * del docente), con las medidas del PDF: tabla de 180 mm (17,5 / 130 / 32,5 mm) y 37 renglones.
 */
export function PrintEvolutionNotesSection({ recordNumber }: PrintEvolutionNotesSectionProps) {
  return (
    <PrintPage recordNumber={recordNumber} wide>
      <table className="w-full table-fixed border-collapse">
        <colgroup>
          <col className="w-[17.5mm]" />
          <col />
          <col className="w-[32.5mm]" />
        </colgroup>
        <thead>
          <tr>
            <th colSpan={3} className={cn(CELL, "text-center font-normal")}>Notas de evolución</th>
          </tr>
          <tr>
            <th colSpan={3} className={cn(CELL, "text-left font-normal")}>Tratante encargado:</th>
          </tr>
          <tr>
            <th className={cn(CELL, "text-center font-normal")}>Fecha</th>
            <th className={cn(CELL, "text-center font-normal")}>Trabajo realizado</th>
            <th className={cn(CELL, "text-center font-normal")}>Firma de docente</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: EVOLUTION_ROWS }, (_, i) => (
            <tr key={i}>
              <td className={CELL} />
              <td className={CELL} />
              <td className={CELL} />
            </tr>
          ))}
        </tbody>
      </table>
    </PrintPage>
  );
}
