package com.odontorisas.service.records.content;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;

import java.math.BigDecimal;

import static com.odontorisas.service.records.content.ContentLimits.MAX_MODEL_MM;

/**
 * Distancias del borde WALA al eje vestibular (EV) de las piezas inferiores, en mm. Las normas
 * (0,6 / 0,8 / 1,3 / 2,0 / 2,2 mm) y la diferencia con ellas son presentación (frontend).
 */
public record WalaToEv(
    @DecimalMin("0") @DecimalMax(MAX_MODEL_MM) @Digits(integer = 2, fraction = 1) BigDecimal canine,
    @DecimalMin("0") @DecimalMax(MAX_MODEL_MM) @Digits(integer = 2, fraction = 1) BigDecimal firstPremolar,
    @DecimalMin("0") @DecimalMax(MAX_MODEL_MM) @Digits(integer = 2, fraction = 1) BigDecimal secondPremolar,
    @DecimalMin("0") @DecimalMax(MAX_MODEL_MM) @Digits(integer = 2, fraction = 1) BigDecimal firstMolar,
    @DecimalMin("0") @DecimalMax(MAX_MODEL_MM) @Digits(integer = 2, fraction = 1) BigDecimal secondMolar) {

    public static WalaToEv empty() {
        return new WalaToEv(null, null, null, null, null);
    }
}
