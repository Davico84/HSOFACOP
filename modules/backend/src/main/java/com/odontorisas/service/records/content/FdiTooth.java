package com.odontorisas.service.records.content;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Pieza dental en notación FDI: permanentes 11–48 y temporales 51–85 (cuadrante 1–8, pieza
 * 1–8 en permanentes y 1–5 en temporales). Con {@code anteriorOnly}, solo incisivos y caninos
 * (posición 1–3). {@code null} es válido (lo rechaza, si hace falta, otra restricción).
 */
@Documented
@Constraint(validatedBy = FdiTooth.Validator.class)
@Target({ElementType.TYPE_USE, ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface FdiTooth {

    String message() default "Pieza dental inválida (notación FDI: 11–48 o 51–85).";

    boolean anteriorOnly() default false;

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    class Validator implements ConstraintValidator<FdiTooth, Integer> {

        private boolean anteriorOnly;

        @Override
        public void initialize(FdiTooth annotation) {
            anteriorOnly = annotation.anteriorOnly();
        }

        @Override
        public boolean isValid(Integer value, ConstraintValidatorContext context) {
            return FdiTeeth.isValid(value, anteriorOnly);
        }
    }
}
