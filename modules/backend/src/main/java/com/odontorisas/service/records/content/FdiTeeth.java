package com.odontorisas.service.records.content;

/** Reglas de la notación FDI (ver {@link FdiTooth}); también las usa la normalización. */
public final class FdiTeeth {

    private FdiTeeth() {
    }

    /** ¿Es {@code code} una pieza FDI válida? {@code null} se considera válido. */
    public static boolean isValid(Integer code, boolean anteriorOnly) {
        if (code == null) {
            return true;
        }
        int quadrant = code / 10;
        int position = code % 10;
        int maxPosition = quadrant >= 1 && quadrant <= 4 ? 8 : quadrant >= 5 && quadrant <= 8 ? 5 : 0;
        if (position < 1 || position > maxPosition) {
            return false;
        }
        return !anteriorOnly || position <= 3;
    }
}
