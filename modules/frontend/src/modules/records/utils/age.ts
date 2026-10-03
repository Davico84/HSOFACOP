/**
 * Edad en años cumplidos (misma regla que `RecordAgeCalculator` del backend): a la fecha de
 * inicio de tratamiento o, si no la hay, a hoy. Fechas ISO `yyyy-mm-dd`. Sin nacimiento → `null`.
 */
export function ageYears(birthDate: string | null | undefined, treatmentStartDate?: string | null, todayIso = today()): number | null {
  if (!birthDate) return null;
  const reference = treatmentStartDate || todayIso;
  if (reference < birthDate) return null;
  const [by, bm, bd] = birthDate.split("-").map(Number);
  const [ry, rm, rd] = reference.split("-").map(Number);
  let age = ry - by;
  if (rm < bm || (rm === bm && rd < bd)) age -= 1;
  return age;
}

/** Mayoría de edad: por debajo firma el apoderado. */
export const ADULT_AGE = 18;

export function isMinor(age: number | null): boolean {
  return age !== null && age < ADULT_AGE;
}

/** Hoy en ISO local (`yyyy-mm-dd`). */
export function today(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
