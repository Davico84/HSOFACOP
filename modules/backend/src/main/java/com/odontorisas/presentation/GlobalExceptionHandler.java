package com.odontorisas.presentation;

import com.odontorisas.infra.config.TraceIdFilter;
import com.odontorisas.service.BusinessException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Manejo de errores en formato RFC 9457 (ProblemDetail). Extiende
 * {@link ResponseEntityExceptionHandler} para que las excepciones propias de
 * Spring MVC (404, 405, JSON malformado…) conserven su status como ProblemDetail
 * en vez de convertirse en 500. Añade {@code timestamp} y {@code traceId}
 * (del MDC, ver {@link TraceIdFilter}) como extensiones. Ver docs/backend.md §10.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * {@code detail} en español para los errores que resuelve el padre por su cuenta
     * (JSON malformado, ruta inexistente, método o tipo de contenido no soportado…).
     * Es un fallback por status, no por tipo de excepción: dos excepciones con el mismo
     * status comparten mensaje a propósito.
     */
    static final Map<HttpStatus, String> DEFAULT_DETAILS = Map.of(
        HttpStatus.BAD_REQUEST, "La solicitud no es válida.",
        HttpStatus.NOT_FOUND, "No se encontró el recurso solicitado.",
        HttpStatus.METHOD_NOT_ALLOWED, "Método no permitido para este recurso.",
        HttpStatus.NOT_ACCEPTABLE, "No se puede generar la respuesta en el formato solicitado.",
        HttpStatus.CONTENT_TOO_LARGE, "La solicitud es demasiado grande.",
        HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Tipo de contenido no soportado.",
        HttpStatus.SERVICE_UNAVAILABLE, "El servicio no está disponible en este momento. Inténtalo más tarde.");

    /** Status sin mensaje propio (o no estándar): nunca se reenvía el texto interno de Spring. */
    static final String GENERIC_DETAIL = "Ocurrió un error al procesar la solicitud.";

    /** Cualquier excepción de negocio → su status + type/errorType uniforme. */
    @ExceptionHandler(BusinessException.class)
    public ProblemDetail handleBusiness(BusinessException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(ex.getStatus(), ex.getMessage());
        problem.setType(URI.create("/errors/" + ex.getErrorType()));
        problem.setTitle(ex.getStatus().getReasonPhrase());
        addExtensions(problem);
        return problem;
    }

    /**
     * Sesión ausente o inválida (no autenticado). Llega aquí porque el entry point de seguridad
     * delega en el {@code HandlerExceptionResolver}: así este 401 sale con el mismo formato RFC
     * 9457 que el resto, en vez del cuerpo por defecto del contenedor ({@code sendError}).
     */
    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail handleAuthentication(AuthenticationException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.UNAUTHORIZED, "Necesitas iniciar sesión para acceder a este recurso.");
        problem.setType(URI.create("/errors/unauthorized"));
        problem.setTitle(HttpStatus.UNAUTHORIZED.getReasonPhrase());
        addExtensions(problem);
        return problem;
    }

    /** Autorización denegada (p. ej. {@code @PreAuthorize}) → 403 con el mismo formato, no 500. */
    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.FORBIDDEN, "No tienes permiso para realizar esta acción.");
        problem.setType(URI.create("/errors/access-denied"));
        problem.setTitle(HttpStatus.FORBIDDEN.getReasonPhrase());
        addExtensions(problem);
        return problem;
    }

    /** Red de seguridad: cualquier error inesperado → 500 (con log del stacktrace y traceId). */
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUncaught(Exception ex) {
        String traceId = MDC.get(TraceIdFilter.TRACE_ID_KEY);
        log.error("[trace {}] Excepción no controlada: {}", traceId, ex.getMessage(), ex);
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.INTERNAL_SERVER_ERROR, "Ocurrió un error inesperado.");
        problem.setType(URI.create("/errors/internal-server-error"));
        problem.setTitle("Internal Server Error");
        addExtensions(problem);
        return problem;
    }

    /** Validación de {@code @Valid} → 400 con la lista de campos inválidos. */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST, "Uno o más campos son inválidos.");
        problem.setType(URI.create("/errors/validation-error"));
        problem.setTitle("Validation failed");
        List<Map<String, String>> errors = ex.getBindingResult().getFieldErrors().stream()
            .map(fe -> Map.of(
                "field", fe.getField(),
                "message", fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Valor inválido"))
            .toList();
        problem.setProperty("errors", errors);
        addExtensions(problem);
        return ResponseEntity.badRequest().body(problem);
    }

    /**
     * Punto final de todo lo que resuelve el padre {@link ResponseEntityExceptionHandler}.
     * Reutiliza su {@code ProblemDetail} (conserva {@code type}/{@code title}/{@code status}/
     * {@code instance}), sustituye el {@code detail} interno de Spring por uno en español y
     * añade {@code timestamp}/{@code traceId}. Los {@code @ExceptionHandler} explícitos de
     * esta clase no pasan por aquí: ya dan su propio {@code detail}.
     */
    @Override
    protected ResponseEntity<Object> handleExceptionInternal(
            Exception ex, Object body, HttpHeaders headers, HttpStatusCode statusCode, WebRequest request) {
        Object enriched = body;
        if (body == null) {
            enriched = ProblemDetail.forStatus(statusCode);
        }
        if (enriched instanceof ProblemDetail problem) {
            HttpStatus status = HttpStatus.resolve(statusCode.value());
            problem.setDetail(status == null ? GENERIC_DETAIL : DEFAULT_DETAILS.getOrDefault(status, GENERIC_DETAIL));
            // Spring deja about:blank y lo omite al serializar: se da el mismo patrón
            // /errors/<slug> que el resto de errores del proyecto. Un type propio se conserva.
            if (problem.getType() == null || ABOUT_BLANK.equals(problem.getType())) {
                problem.setType(URI.create("/errors/" + typeSlug(status)));
            }
            addExtensions(problem);
        }
        return super.handleExceptionInternal(ex, enriched, headers, statusCode, request);
    }

    private static final URI ABOUT_BLANK = URI.create("about:blank");

    /** {@code NOT_FOUND} → {@code not-found}; status no estándar → {@code error}. */
    private static String typeSlug(HttpStatus status) {
        return status == null ? "error" : status.name().toLowerCase(java.util.Locale.ROOT).replace('_', '-');
    }

    private void addExtensions(ProblemDetail problem) {
        problem.setProperty("timestamp", Instant.now());
        String traceId = MDC.get(TraceIdFilter.TRACE_ID_KEY);
        if (traceId != null) {
            problem.setProperty("traceId", traceId);
        }
    }
}
