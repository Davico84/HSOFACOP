package com.odontorisas.service.records.content;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

import static com.odontorisas.service.records.content.ContentLimits.LONG_TEXT;
import static com.odontorisas.service.records.content.ContentLimits.MAX_MODEL_MM;

/**
 * Análisis transversal de los modelos (pág. 5 del PDF), en mm con un decimal. Las diferencias con
 * el promedio intermolar por sexo y con las normas WALA–EV se calculan al mostrar (no se guardan).
 * El ancho X ideal se escribe a mano (decisión del usuario).
 */
public record TransversalAnalysis(
    /** AIS: ancho inter canino superior. */
    @DecimalMin("0") @DecimalMax(MAX_MODEL_MM) @Digits(integer = 2, fraction = 1) BigDecimal intercanineUpper,
    /** AII: ancho inter canino inferior. */
    @DecimalMin("0") @DecimalMax(MAX_MODEL_MM) @Digits(integer = 2, fraction = 1) BigDecimal intercanineLower,
    /** AMS: ancho molar superior. */
    @DecimalMin("0") @DecimalMax(MAX_MODEL_MM) @Digits(integer = 2, fraction = 1) BigDecimal intermolarUpper,
    /** AMI: ancho molar inferior. */
    @DecimalMin("0") @DecimalMax(MAX_MODEL_MM) @Digits(integer = 2, fraction = 1) BigDecimal intermolarLower,
    @DecimalMin("0") @DecimalMax(MAX_MODEL_MM) @Digits(integer = 2, fraction = 1) BigDecimal walaWidth,
    @DecimalMin("0") @DecimalMax(MAX_MODEL_MM) @Digits(integer = 2, fraction = 1) BigDecimal xPcWidth,
    @DecimalMin("0") @DecimalMax(MAX_MODEL_MM) @Digits(integer = 2, fraction = 1) BigDecimal xPrimePcWidth,
    @DecimalMin("0") @DecimalMax(MAX_MODEL_MM) @Digits(integer = 2, fraction = 1) BigDecimal xIdealWidth,
    @Valid WalaToEv walaToEv,
    @Size(max = LONG_TEXT) String interpretation) {

    public static TransversalAnalysis empty() {
        return new TransversalAnalysis(null, null, null, null, null, null, null, null, WalaToEv.empty(), null);
    }
}
