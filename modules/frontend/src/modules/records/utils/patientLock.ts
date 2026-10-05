/** Datos del paciente que quedan fijos al imprimir (en el orden del formulario). */
export const LOCKED_PATIENT_FIELDS = ["patientName", "patientSex", "documentType", "documentNumber", "birthPlace", "birthDate"] as const;

/** "06/10/2026" (fecha local de un instante). */
export function formatInstantDate(instant: string): string {
  return new Date(instant).toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
