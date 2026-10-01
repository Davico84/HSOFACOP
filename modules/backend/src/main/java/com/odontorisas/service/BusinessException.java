package com.odontorisas.service;

import org.springframework.http.HttpStatus;

/**
 * Base de las excepciones de negocio. Lleva el {@link HttpStatus} y un
 * {@code errorType} (slug) para que el {@code GlobalExceptionHandler} las mapee
 * a una respuesta RFC 9457 (ProblemDetail) de forma uniforme, sin un handler por
 * cada excepción.
 */
public abstract class BusinessException extends RuntimeException {

    private final HttpStatus status;
    private final String errorType;

    protected BusinessException(String message, HttpStatus status, String errorType) {
        super(message);
        this.status = status;
        this.errorType = errorType;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getErrorType() {
        return errorType;
    }
}
