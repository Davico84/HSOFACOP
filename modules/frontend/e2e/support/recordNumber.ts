/**
 * Número de historia para las E2E con backend. La base local se conserva entre corridas y el número
 * es único entre todas las historias: se deriva del reloj (con algo de azar por los workers en
 * paralelo) para no chocar con los de corridas anteriores.
 */
export function uniqueRecordNumber(): string {
  const n = (Date.now() + Math.floor(Math.random() * 1000)) % 10000;
  return `AOC-${String(n).padStart(4, "0")}`;
}
