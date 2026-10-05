package com.odontorisas.service.records;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

/**
 * Pasos del formulario (1–8) con datos, guardados como máscara de bits: bit {@code n-1} = paso
 * {@code n}. El paso 1 siempre cuenta: el nombre del paciente es obligatorio.
 */
public final class FilledSteps {

    /** Pasos 1–7 (clínicos): el 8 (Firmas) se completa a mano y no cuenta para la completitud. */
    public static final int CLINICAL_MASK = 0b0111_1111;
    public static final int CLINICAL_STEPS = 7;
    private static final int FIRST_STEP = 1;

    private FilledSteps() {
    }

    /** Máscara de los pasos indicados (nulo o vacío = solo el paso 1). */
    public static int toMask(Collection<Integer> steps) {
        int mask = FIRST_STEP;
        if (steps != null) {
            for (Integer step : steps) {
                mask |= 1 << (step - 1);
            }
        }
        return mask;
    }

    /** Pasos de una máscara, en orden; nulo = sin calcular. */
    public static List<Integer> toList(Integer mask) {
        if (mask == null) {
            return null;
        }
        List<Integer> steps = new ArrayList<>();
        for (int step = 1; step <= 8; step++) {
            if ((mask & (1 << (step - 1))) != 0) {
                steps.add(step);
            }
        }
        return steps;
    }
}
