package com.odontorisas.presentation.dto;

import com.odontorisas.common.DocumentType;
import com.odontorisas.service.records.content.RecordContent;
import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.time.LocalDate;

/**
 * Datos del paciente comunes a crear y guardar una historia, con sus reglas entre campos
 * (scenarios de "Datos del paciente con edad calculada"): documento con tipo y número del formato
 * de ese tipo, inicio de tratamiento no anterior al nacimiento, y fecha de la primera menstruación
 * no futura ni anterior al nacimiento. Cada error va a su campo. "Hoy" sale del {@code ClockProvider}
 * de la validación, que usa el reloj de la app (zona de la clínica).
 */
public interface PatientFields {

    DocumentType documentType();

    String documentNumber();

    LocalDate birthDate();

    LocalDate treatmentStartDate();

    RecordContent content();

    @Documented
    @Constraint(validatedBy = Validator.class)
    @Target(ElementType.TYPE)
    @Retention(RetentionPolicy.RUNTIME)
    @interface Consistent {
        String message() default "Datos del paciente inconsistentes.";

        Class<?>[] groups() default {};

        Class<? extends Payload>[] payload() default {};
    }

    class Validator implements ConstraintValidator<Consistent, PatientFields> {

        @Override
        public boolean isValid(PatientFields value, ConstraintValidatorContext context) {
            if (value == null) {
                return true;
            }
            context.disableDefaultConstraintViolation();
            boolean valid = true;
            String number = value.documentNumber() == null ? null : value.documentNumber().strip();
            boolean hasNumber = number != null && !number.isEmpty();
            if (value.documentType() == null && hasNumber) {
                valid = violation(context, "documentType", "Indica el tipo de documento.");
            } else if (value.documentType() != null && !hasNumber) {
                valid = violation(context, "documentNumber", "Indica el número del documento.");
            } else if (value.documentType() != null && !value.documentType().accepts(number)) {
                valid = violation(context, "documentNumber", formatMessage(value.documentType()));
            }
            if (value.birthDate() != null && value.treatmentStartDate() != null
                    && value.treatmentStartDate().isBefore(value.birthDate())) {
                valid = violation(context, "treatmentStartDate",
                    "La fecha de inicio de tratamiento no puede ser anterior a la de nacimiento.");
            }
            LocalDate menarcheDate = value.content() == null || value.content().anamnesis() == null
                ? null : value.content().anamnesis().menarcheDate();
            if (menarcheDate != null) {
                LocalDate today = LocalDate.now(context.getClockProvider().getClock());
                if (menarcheDate.isAfter(today)) {
                    valid = menarcheViolation(context, "La fecha de la primera menstruación no puede ser futura.");
                } else if (value.birthDate() != null && menarcheDate.isBefore(value.birthDate())) {
                    valid = menarcheViolation(context,
                        "La fecha de la primera menstruación no puede ser anterior a la de nacimiento.");
                }
            }
            return valid;
        }

        private static boolean menarcheViolation(ConstraintValidatorContext context, String message) {
            context.buildConstraintViolationWithTemplate(message)
                .addPropertyNode("content").addPropertyNode("anamnesis").addPropertyNode("menarcheDate")
                .addConstraintViolation();
            return false;
        }

        private static String formatMessage(DocumentType type) {
            return switch (type) {
                case DNI -> "El DNI debe tener 8 dígitos.";
                case FOREIGNER_CARD -> "El carné de extranjería debe tener 9 dígitos.";
                case PASSPORT -> "El pasaporte debe tener entre 6 y 12 dígitos.";
            };
        }

        private static boolean violation(ConstraintValidatorContext context, String field, String message) {
            context.buildConstraintViolationWithTemplate(message).addPropertyNode(field).addConstraintViolation();
            return false;
        }
    }
}
