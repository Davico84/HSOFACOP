package com.odontorisas.service.records.content;

import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Digits;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.math.BigDecimal;

import static com.odontorisas.service.records.content.ContentLimits.MAX_MM;
import static com.odontorisas.service.records.content.ContentLimits.MIN_MIDLINE_MM;

/**
 * Línea media de una arcada: centrada o desviada a un lado. Desviada exige milímetros ≥ 0,5
 * (error en {@code deviationMm}); centrada no lleva milímetros (los descarta la normalización).
 */
@Midline.Consistent
public record Midline(
    Position position,
    @DecimalMax(MAX_MM) @Digits(integer = 2, fraction = 1) BigDecimal deviationMm) {

    /** Solo se añaden valores. */
    public enum Position { CENTERED, DEVIATED_RIGHT, DEVIATED_LEFT }

    public boolean isDeviated() {
        return position == Position.DEVIATED_RIGHT || position == Position.DEVIATED_LEFT;
    }

    @Documented
    @Constraint(validatedBy = ConsistentValidator.class)
    @Target(ElementType.TYPE)
    @Retention(RetentionPolicy.RUNTIME)
    public @interface Consistent {
        String message() default "Indica la desviación en milímetros (mínimo 0,5 mm).";

        Class<?>[] groups() default {};

        Class<? extends Payload>[] payload() default {};
    }

    public static class ConsistentValidator implements ConstraintValidator<Consistent, Midline> {

        private static final BigDecimal MIN = new BigDecimal(MIN_MIDLINE_MM);

        @Override
        public boolean isValid(Midline value, ConstraintValidatorContext context) {
            if (value == null || !value.isDeviated()) {
                return true;
            }
            if (value.deviationMm() != null && value.deviationMm().compareTo(MIN) >= 0) {
                return true;
            }
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(context.getDefaultConstraintMessageTemplate())
                .addPropertyNode("deviationMm").addConstraintViolation();
            return false;
        }
    }
}
