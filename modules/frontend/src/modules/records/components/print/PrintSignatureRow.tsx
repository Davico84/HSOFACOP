import { PrintField } from "./PrintField";

interface PrintSignatureRowProps {
  name?: string | null;
  /** Parentesco (solo el apoderado). */
  relationship?: string | null;
}

/**
 * Fila de firma: nombre a la izquierda y "Firma ____" en una columna de ancho fijo a la derecha,
 * igual en todas las filas para que las palabras "Firma" y sus líneas queden alineadas.
 */
export function PrintSignatureRow({ name, relationship }: PrintSignatureRowProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_62mm] items-end gap-[8mm]">
      <div className="flex min-w-0 gap-[6mm]">
        <PrintField label="Nombre" value={name} grow={2} />
        {relationship !== undefined ? <PrintField label="Parentesco" value={relationship} /> : null}
      </div>
      <PrintField label="Firma" value="" lined />
    </div>
  );
}
