package com.odontorisas.service.records.content;

/** Límites del contenido clínico (design D2). El frontend replica los mismos en Zod. */
public final class ContentLimits {

    /** Texto corto (una línea del PDF). */
    public static final int SHORT_TEXT = 200;
    /** Texto largo (varias líneas del PDF). */
    public static final int LONG_TEXT = 4000;
    /** Cada ítem de la lista de problemas o de metas. */
    public static final int LIST_ITEM = 500;
    /** Ítems por lista. */
    public static final int LIST_ITEMS = 30;
    /** Milímetros: 0–30 con un decimal. */
    public static final String MAX_MM = "30.0";

    /** Separación interlabial del sellado labial: 0–20 mm con un decimal. */
    public static final String MAX_LIP_SEAL_MM = "20.0";
    /** Medidas de los análisis de modelos: 0–99,9 mm con un decimal. */
    public static final String MAX_MODEL_MM = "99.9";
    /** Suma de los anchos de 12 piezas de una arcada (Wolford): 0–199,9 mm con un decimal. */
    public static final String MAX_ARCH_SUM_MM = "199.9";
    /** Ancho mesiodistal de una pieza: 4,0–13,0 mm con un decimal (lo que mide un diente real). */
    public static final String MIN_TOOTH_MM = "4.0";
    public static final String MAX_TOOTH_MM = "13.0";
    /** Desviación mínima de la línea media cuando está desviada. */
    public static final String MIN_MIDLINE_MM = "0.5";

    private ContentLimits() {
    }
}
