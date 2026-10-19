package com.odontorisas.presentation.dto;

import com.odontorisas.common.DocumentType;
import com.odontorisas.service.users.ContactData;
import jakarta.validation.Constraint;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.regex.Pattern;

/**
 * Datos de contacto e identificación de una cuenta, comunes al registro y a "Mis datos" (requirement
 * "Datos de contacto e identificación de la cuenta"), todos opcionales: celular de 9 dígitos que
 * empieza con 9, documento con tipo y número del formato de ese tipo (siempre juntos) y COP de 1 a 6
 * dígitos. Los DTO normalizan antes con {@link #clean}: vacío o solo espacios = {@code null}, así los
 * {@code CHECK} de V19 ({@code IS NULL OR …}) aceptan "sin dato". Cada error va a su campo.
 */
public interface ContactFields {

    Pattern PHONE = Pattern.compile("9\\d{8}");
    Pattern COP = Pattern.compile("\\d{1,6}");

    String phone();

    DocumentType documentType();

    String documentNumber();

    String copNumber();

    default ContactData toContact() {
        return new ContactData(phone(), documentType(), documentNumber(), copNumber());
    }

    /** Recorta; vacío o solo espacios = {@code null}. */
    static String clean(String value) {
        if (value == null) {
            return null;
        }
        String stripped = value.strip();
        return stripped.isEmpty() ? null : stripped;
    }

    @Documented
    @Constraint(validatedBy = Validator.class)
    @Target(ElementType.TYPE)
    @Retention(RetentionPolicy.RUNTIME)
    @interface Consistent {
        String message() default "Datos de contacto inválidos.";

        Class<?>[] groups() default {};

        Class<? extends Payload>[] payload() default {};
    }

    class Validator implements ConstraintValidator<Consistent, ContactFields> {

        @Override
        public boolean isValid(ContactFields value, ConstraintValidatorContext context) {
            if (value == null) {
                return true;
            }
            context.disableDefaultConstraintViolation();
            boolean valid = true;
            if (value.phone() != null && !PHONE.matcher(value.phone()).matches()) {
                valid = violation(context, "phone", "El celular debe tener 9 dígitos y empezar con 9.");
            }
            if (value.documentType() == null && value.documentNumber() != null) {
                valid = violation(context, "documentType", "Indica el tipo de documento.");
            } else if (value.documentType() != null && value.documentNumber() == null) {
                valid = violation(context, "documentNumber", "Indica el número del documento.");
            } else if (value.documentType() != null && !value.documentType().accepts(value.documentNumber())) {
                valid = violation(context, "documentNumber", formatMessage(value.documentType()));
            }
            if (value.copNumber() != null && !COP.matcher(value.copNumber()).matches()) {
                valid = violation(context, "copNumber", "El COP debe tener entre 1 y 6 dígitos.");
            }
            return valid;
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
