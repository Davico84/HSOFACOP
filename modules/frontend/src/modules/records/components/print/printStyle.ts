/**
 * Medidas del PDF original de la historia (medidas con PyMuPDF sobre el PDF de la clínica):
 * Arial 10 pt, renglones cada 17,3 pt, títulos de sección en negrita 12 pt, cabecera 14 pt,
 * márgenes 20 mm arriba/abajo, 24 mm derecha y 25 mm izquierda.
 */
export const PRINT_MARGINS = { top: "20mm", right: "24mm", bottom: "20mm", left: "25mm" } as const;

/**
 * Reglas de página: A4 sin margen de página. Los márgenes del PDF los lleva cada hoja por dentro
 * (igual que en la vista previa), así el diálogo de impresión no puede cambiarlos ni añadir su
 * cabecera/pie (fecha, URL), y lo impreso coincide con lo que se ve en pantalla.
 */
/**
 * Página A4 sin margen propio y control de impresión: al imprimir, las hojas están ocultas salvo
 * mientras el botón "Imprimir" de la vista preliminar tiene registrada la impresión
 * (`data-print-ready`); por cualquier otro medio (Ctrl+P, menú) sale solo el aviso.
 */
export const PAGE_CSS = [
  "@page { size: A4; margin: 0; }",
  ".print-guard-notice { display: none; }",
  "@media print {",
  "  .print-sheets { display: none; }",
  "  [data-print-ready] .print-sheets { display: block; }",
  "  .print-guard-notice { display: block; }",
  "  [data-print-ready] .print-guard-notice { display: none; }",
  "}",
].join("\n");

/** Ancho de una hoja A4 en pantalla (210 mm a 96 ppp), para reducirla en pantallas angostas. */
export const SHEET_WIDTH_PX = 794;

/** Alto de un renglón del PDF. */
export const ROW = "h-[17.3pt]";
export const ROW_MIN = "min-h-[17.3pt]";
export const ROW_LEADING = "leading-[17.3pt]";

/**
 * Pregunta o etiqueta: 1 pt más que la respuesta (11 pt / 10 pt) para distinguirlas; los títulos
 * de sección siguen en 12 pt negrita (revisión del usuario).
 */
export const LABEL = "text-[11pt]";

/** Celda de una tabla impresa (fichas de Moyers y Nance): borde fino, valor en 10 pt. */
export const TABLE_CELL = "border border-ink px-[4pt] py-[2pt]";

/**
 * Celda de etiqueta de una tabla impresa: sombreada y en 11 pt, para distinguirla de los valores
 * registrados (10 pt, fondo blanco). `print-color-adjust: exact` hace que el sombreado salga en papel.
 */
export const TABLE_HEAD = `${TABLE_CELL} ${LABEL} bg-muted font-normal [print-color-adjust:exact]`;

/** Celda de un valor numérico de una tabla impresa. */
export const TABLE_NUM = `${TABLE_CELL} text-center tabular-nums`;
