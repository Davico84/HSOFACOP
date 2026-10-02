import type { ReactNode } from "react";

interface PrintTitleProps {
  children: ReactNode;
  /** Subtítulo en negrita cursiva 10 pt (TRANSVERSAL, VERTICAL…); por defecto, título 12 pt. */
  sub?: boolean;
}

/** Título de bloque como en el PDF: negrita 12 pt con aire antes, o subtítulo negrita cursiva 10 pt. */
export function PrintTitle({ children, sub = false }: PrintTitleProps) {
  return sub ? (
    <h3 className="mt-[7pt] text-[10pt] font-bold italic">{children}</h3>
  ) : (
    <h2 className="mt-[7pt] text-[12pt] leading-[24pt] font-bold uppercase">{children}</h2>
  );
}
