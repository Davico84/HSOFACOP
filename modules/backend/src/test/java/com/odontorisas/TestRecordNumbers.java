package com.odontorisas;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * Números de historia únicos para toda la suite: el número es único entre todas las historias y
 * los IT comparten la base, así que cada historia de prueba toma el siguiente ({@code AOC-0001}, …).
 */
public final class TestRecordNumbers {

    private static final AtomicInteger NEXT = new AtomicInteger(1);

    private TestRecordNumbers() {
    }

    public static String next() {
        int n = NEXT.getAndIncrement();
        if (n > 9999) {
            throw new IllegalStateException("Se agotaron los números AOC- de prueba");
        }
        return "AOC-%04d".formatted(n);
    }

    /** El cuerpo JSON con {@code recordNumber} (si no lo trae ya). */
    public static String withNumber(String json, String number) {
        if (json.contains("\"recordNumber\"")) {
            return json;
        }
        String body = json.strip();
        String rest = body.substring(1).strip();
        return "{\"recordNumber\":\"" + number + "\"" + (rest.equals("}") ? "}" : "," + rest);
    }
}
