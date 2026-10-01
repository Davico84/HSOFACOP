package com.odontorisas.service.records.content;

import jakarta.validation.Valid;

/** Relación de ambos lados del paciente. */
public record SideRelations(@Valid AngleRelation right, @Valid AngleRelation left) {
}
