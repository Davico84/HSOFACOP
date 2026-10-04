import type { RecordResponse } from "@/modules/core/services/generated/model";
import { cn } from "@/modules/core/utils/cn";
import { BOLTON_RATIOS, LOWER_BOLTON_TEETH, UPPER_BOLTON_TEETH, boltonWidth } from "../../config/bolton";
import { formatAge, formatDate } from "../../utils/recordDisplay";
import { boltonResult } from "../../utils/bolton";
import { formatMm, formatSigned } from "../../utils/transversal";
import { BoltonFormula } from "../BoltonFormula";
import { PrintField } from "./PrintField";
import { PrintLines } from "./PrintLines";
import { PrintPage } from "./PrintPage";
import { TABLE_CELL, TABLE_HEAD, TABLE_NUM } from "./printStyle";

interface PrintBoltonSectionProps {
  record: RecordResponse;
}

/**
 * Pág. 9: "Análisis de Bolton", en español (la ficha del PDF es una imagen en inglés). Los anchos de
 * 15→25 y 45→35 son los de Nance; sumas, relaciones, ideal y diferencia se calculan al imprimir.
 */
export function PrintBoltonSection({ record }: PrintBoltonSectionProps) {
  const models = record.content.models;
  const width = (t: number) => boltonWidth(models, t);
  const widthsRow = (teeth: readonly number[]) => (
    <tr>
      <td className={TABLE_CELL} />
      {teeth.map((t) => (
        <td key={t} className={cn(TABLE_NUM, "px-[2pt]")} aria-label={`Pieza ${t}`}>{formatMm(width(t))}</td>
      ))}
      <td className={TABLE_CELL} />
    </tr>
  );
  const teethRow = (teeth: readonly number[]) => (
    <tr>
      <th className={TABLE_HEAD}>R</th>
      {teeth.map((t) => (
        <th key={t} scope="col" className={cn(TABLE_HEAD, "px-[2pt] text-center")}>{t}</th>
      ))}
      <th className={TABLE_HEAD}>L</th>
    </tr>
  );

  return (
    <PrintPage recordNumber={record.recordNumber} title="Análisis de Bolton">
      <div className="mt-[4pt] flex flex-col">
        <PrintField label="Nombre" value={record.patientName} lined />
        <div className="flex gap-4">
          <PrintField label="Edad" value={formatAge(record.ageYears)} lined center />
          <PrintField label="Fecha" value={formatDate(models?.bolton?.analysisDate)} grow={2} lined center />
        </div>
      </div>
      <p className="mt-[10pt] text-[11pt] font-bold">Ancho mesiodistal de las piezas (mm)</p>
      <table className="mt-[4pt] w-full border-collapse">
        <tbody>
          {teethRow(UPPER_BOLTON_TEETH)}
          {widthsRow(UPPER_BOLTON_TEETH)}
          {widthsRow(LOWER_BOLTON_TEETH)}
          {teethRow(LOWER_BOLTON_TEETH)}
        </tbody>
      </table>
      {BOLTON_RATIOS.map((def) => {
        const r = boltonResult(def, width);
        const mean = formatMm(def.mean);
        const cells = (active: boolean) => [
          active && r.actual !== null ? `${formatMm(r.actual)} mm` : "",
          active && r.ideal !== null ? `${formatMm(r.ideal)} mm` : "",
          active && r.difference !== null ? `${formatSigned(r.difference)} mm` : "",
        ];
        return (
          <section key={def.key} aria-label={def.label} className="mt-[12pt] break-inside-avoid">
            <p className="flex items-baseline justify-between text-[11pt]">
              <b className="uppercase">{def.label}</b>
              <span>Media: {mean} % · Rango: {formatMm(def.range[0])} – {formatMm(def.range[1])} %</span>
            </p>
            <div className="mt-[4pt] flex items-center gap-[6mm]">
              <BoltonFormula print count={def.count} mandibular={r.mandibular} maxillary={r.maxillary} quotient={r.quotient} ratio={r.ratio} />
              {r.inRange === null ? null : r.inRange ? <span className="text-[10pt] italic">Dentro del rango</span> : <span className="text-[10pt] font-bold">⚠ Fuera del rango</span>}
            </div>
            <table className="mt-[6pt] w-full border-collapse">
              <thead>
                <tr>
                  <th colSpan={3} className={TABLE_HEAD}>&gt; {mean} % · exceso mandibular</th>
                  <th colSpan={3} className={TABLE_HEAD}>&lt; {mean} % · exceso maxilar</th>
                </tr>
                <tr>
                  {[`Real mand. ${def.count}`, `Ideal mand. ${def.count}`, "Dif.", `Real max. ${def.count}`, `Ideal max. ${def.count}`, "Dif."].map((h, i) => (
                    <th key={i} className={TABLE_HEAD}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {[...cells(r.excess === "mandibular"), ...cells(r.excess === "maxillary")].map((c, i) => (
                    <td key={i} className={TABLE_NUM}>{c}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </section>
        );
      })}
      <PrintLines label="INTERPRETACIÓN" value={models?.bolton?.interpretation} lines={3} />
    </PrintPage>
  );
}
