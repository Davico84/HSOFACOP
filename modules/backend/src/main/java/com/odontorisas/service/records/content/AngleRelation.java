package com.odontorisas.service.records.content;

import jakarta.validation.constraints.Size;

import static com.odontorisas.service.records.content.ContentLimits.SHORT_TEXT;

/** Relación canina o molar de un lado: clase de Angle + detalle libre (p. ej. "½ cúspide"). */
public record AngleRelation(AngleClass angleClass, @Size(max = SHORT_TEXT) String detail) {
}
