import type { AngleRelation, Midline, RecordResponse, SideRelations } from "@/modules/core/services/generated/model";
import {
  angleClassOptions, crossbiteTypeOptions, labelOf, midlineOptions, sideOptions, speeOptions, transverseOptions,
  verticalOptions, yesNoOptions,
} from "../../config/options";
import { formatTeeth } from "../../utils/fdi";
import { PrintChoice } from "./PrintChoice";
import { PrintField } from "./PrintField";
import { PrintLines } from "./PrintLines";
import { PrintPage } from "./PrintPage";
import { PrintTitle } from "./PrintTitle";

interface PrintOcclusalSectionProps {
  record: RecordResponse;
}

function relation(r: AngleRelation | null | undefined): string {
  return [labelOf(angleClassOptions, r?.angleClass), r?.detail].filter(Boolean).join(" ");
}

function midline(name: string, m: Midline | null | undefined): string {
  if (!m?.position) return `${name} ____`;
  const mm = m.deviationMm != null ? ` ${String(m.deviationMm).replace(".", ",")} mm` : "";
  return `${name} ${labelOf(midlineOptions, m.position).toLowerCase()}${mm}`;
}

const numberText = (n: number | null | undefined) => (n == null ? "" : String(n).replace(".", ","));

/** Págs. 3 (parte baja) y 4: análisis oclusal y extra. */
export function PrintOcclusalSection({ record }: PrintOcclusalSectionProps) {
  const o = record.content.occlusal;
  const rows: [string, SideRelations | null | undefined, boolean][] = [
    ["Relación de caninos:", o.canineRelation, true],
    ["Relación de molares:", o.molarRelation, true],
    ["Relación de caninos (RC) — MI ≠ RC:", o.canineRelationMi, o.miDiffersFromRc === true],
    ["Relación de caninos (RC) — MIH ≠ RC:", o.canineRelationMih, o.mihDiffersFromRc === true],
  ];
  return (
    <PrintPage recordNumber={record.recordNumber} title="Análisis oclusal">
      <PrintTitle sub>TRANSVERSAL</PrintTitle>
      <PrintChoice options={transverseOptions} value={o.transverse} />
      {o.crossbiteSide ? <p className="pl-[8mm]">Lado de la mordida cruzada unilateral: {labelOf(sideOptions, o.crossbiteSide)}</p> : null}
      <PrintChoice label="Característica de la mordida cruzada:" options={crossbiteTypeOptions} value={o.crossbiteType} />
      <PrintTitle sub>VERTICAL</PrintTitle>
      <PrintChoice options={verticalOptions.slice(0, 2)} value={o.vertical} vertical />
      <span className="flex w-[90mm] items-end gap-1">
        {o.vertical === "DEEP_BITE" ? "☒" : "☐"} <PrintField label="Mordida profunda de" value={numberText(o.deepBitePercent)} /> %
      </span>
      <span className="flex w-[90mm] items-end gap-1">
        {o.vertical === "OPEN_BITE" ? "☒" : "☐"} <PrintField label="Mordida abierta de" value={numberText(o.openBiteMm)} /> mm
      </span>
      <PrintChoice label="CURVA DE SPEE:" options={speeOptions} value={o.speeCurve} />
      <div className="flex"><PrintField label="Alterada:" value={o.speeCurveDetail} /></div>
      <PrintTitle sub>ANTEROPOSTERIOR</PrintTitle>
      <p>{o.anteroposteriorNormal ? "☒" : "☐"} Normal</p>
      <div className="flex flex-wrap gap-x-4">
        <PrintField label="Overjet aumentado (mm)" value={numberText(o.overjetMm)} />
        <PrintField label="Mordida cruzada anterior (piezas)" value={formatTeeth(o.anteriorCrossbiteTeeth)} grow={2} />
      </div>
      <div className="flex">
        <PrintField label="Línea media" value={`${midline("superior", o.midlineUpper)} · ${midline("inferior", o.midlineLower)}`} />
      </div>
      <table className="mt-[7pt] w-full">
        <thead>
          <tr>
            <th />
            <th className="text-left font-normal">Lado derecho</th>
            <th className="text-left font-normal">Lado izquierdo</th>
          </tr>
        </thead>
        <tbody>
          {rows.filter(([, , show]) => show).map(([label, r]) => (
            <tr key={label}>
              <td className="pr-3">{label}</td>
              <td className="pr-3"><span className="block min-h-[1.2em] border-b border-foreground">{relation(r?.right)}</span></td>
              <td><span className="block min-h-[1.2em] border-b border-foreground">{relation(r?.left)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      <PrintTitle>EXTRA</PrintTitle>
      <PrintLines label="Anomalías Dentales (forma/color/número)." value={o.dentalAnomalies} lines={1} />
      <PrintLines label="Condición de la ATM" value={o.tmjCondition} lines={1} />
      <div className="flex flex-wrap items-end gap-x-4">
        <PrintChoice label="¿Hay algún familiar con la misma maloclusión?" options={yesNoOptions} value={o.familyMalocclusion} />
        <PrintField label="¿Quién?" value={o.familyMalocclusionWho} grow={2} />
      </div>
    </PrintPage>
  );
}
