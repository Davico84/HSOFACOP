import { PrintField } from "./PrintField";

interface PrintSignatureRowProps {
  name?: string | null;
  /** Parentesco (solo el apoderado). */
  relationship?: string | null;
}

/**
 * Fila de firma: nombre a la izquierda y "Firma ____" en una columna de ancho fijo a la derecha
 * (línea de ~41 mm), igual en todas las filas para que "Firma" y sus líneas queden alineadas. Un
 * nombre largo continúa debajo en su columna; "Firma" queda a la altura de su primer renglón.
 */
export function PrintSignatureRow({ name, relationship }: PrintSignatureRowProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_52mm] items-start gap-[8mm]">
      <div className="flex min-w-0 gap-[6mm]">
        <PrintField label="Nombre" value={name} grow={2} />
        {relationship !== undefined ? <PrintField label="Parentesco" value={relationship} /> : null}
      </div>
      <PrintField label="Firma" value="" lined />
    </div>
  );
}
