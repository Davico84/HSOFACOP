import type { RecordSummaryResponseDocumentType } from "@/modules/core/services/generated/model";
import { documentTypeShort } from "../config/options";

/** `2026-05-19` → `19/05/2026`; vacío si no hay fecha. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

/** Fecha y hora local de un instante (última modificación). */
export function formatDateTime(instant: string): string {
  return new Date(instant).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" });
}

/** "DNI 74125896", "CE 001234567", "Pasaporte 12345678"; vacío sin documento. */
export function formatDocument(type: RecordSummaryResponseDocumentType | null | undefined, number: string | null | undefined): string {
  if (!type || !number) return "";
  return `${documentTypeShort[type]} ${number}`;
}

/** "13 años" / "1 año"; vacío sin edad. */
export function formatAge(age: number | null | undefined): string {
  if (age === null || age === undefined) return "";
  return age === 1 ? "1 año" : `${age} años`;
}
