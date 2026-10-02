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
export const PAGE_CSS = "@page { size: A4; margin: 0; }";

/** Alto de un renglón del PDF. */
export const ROW = "h-[17.3pt]";
export const ROW_MIN = "min-h-[17.3pt]";
export const ROW_LEADING = "leading-[17.3pt]";
