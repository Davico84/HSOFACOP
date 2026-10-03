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
    /** Medidas de los análisis de modelos: 0–99,9 mm con un decimal. */
    public static final String MAX_MODEL_MM = "99.9";
    /** Desviación mínima de la línea media cuando está desviada. */
    public static final String MIN_MIDLINE_MM = "0.5";

    private ContentLimits() {
    }
}
