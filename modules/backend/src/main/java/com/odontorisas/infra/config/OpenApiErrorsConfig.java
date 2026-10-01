package com.odontorisas.infra.config;

import com.odontorisas.infra.security.PublicPaths;
import com.odontorisas.presentation.dto.ApiProblem;
import io.swagger.v3.core.converter.AnnotatedType;
import io.swagger.v3.core.converter.ModelConverters;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.media.Content;
import io.swagger.v3.oas.models.media.MediaType;
import io.swagger.v3.oas.models.media.Schema;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import org.springdoc.core.customizers.OpenApiCustomizer;
import org.springdoc.core.customizers.OperationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.method.HandlerMethod;

/**
 * Errores transversales del contrato, sin declararlos operación a operación:
 * <ul>
 *   <li>{@code 500} en toda operación;</li>
 *   <li>{@code 403} si el método o su clase llevan {@code @PreAuthorize} (también como
 *       meta-anotación). Solo {@code @PreAuthorize}: es lo único que {@code @EnableMethodSecurity}
 *       aplica con la config actual; documentar {@code @Secured}/{@code @RolesAllowed} sería mentir;</li>
 *   <li>{@code 401} en toda ruta que no esté en {@link PublicPaths}.</li>
 * </ul>
 * Idempotente: nunca reemplaza una respuesta ya declarada con {@code @ApiResponse} (un
 * {@code 401} propio de una ruta pública, como credenciales inválidas, se conserva).
 */
@Configuration
class OpenApiErrorsConfig {

    static final String API_PROBLEM_REF = "#/components/schemas/ApiProblem";

    @Bean
    OperationCustomizer transversalOperationErrors() {
        return OpenApiErrorsConfig::addOperationErrors;
    }

    @Bean
    OpenApiCustomizer transversalUnauthorizedErrors() {
        return OpenApiErrorsConfig::addUnauthorizedErrors;
    }

    static Operation addOperationErrors(Operation operation, HandlerMethod handlerMethod) {
        addIfAbsent(operation, "500", "Error inesperado");
        if (requiresRole(handlerMethod)) {
            addIfAbsent(operation, "403", "Sin permiso para realizar esta acción");
        }
        return operation;
    }

    static boolean requiresRole(HandlerMethod handlerMethod) {
        return AnnotatedElementUtils.hasAnnotation(handlerMethod.getMethod(), PreAuthorize.class)
            || AnnotatedElementUtils.hasAnnotation(handlerMethod.getBeanType(), PreAuthorize.class);
    }

    static void addUnauthorizedErrors(OpenAPI openApi) {
        registerApiProblemSchema(openApi);
        if (openApi.getPaths() == null) {
            return;
        }
        openApi.getPaths().forEach((path, item) -> {
            if (!PublicPaths.matches(path)) {
                item.readOperations().forEach(op -> addIfAbsent(op, "401", "Sesión ausente o inválida"));
            }
        });
    }

    /** Garantiza que {@code ApiProblem} esté en components aunque ninguna operación lo referencie. */
    static void registerApiProblemSchema(OpenAPI openApi) {
        if (openApi.getComponents() == null) {
            openApi.setComponents(new Components());
        }
        Components components = openApi.getComponents();
        if (components.getSchemas() != null && components.getSchemas().containsKey("ApiProblem")) {
            return;
        }
        ModelConverters.getInstance(true)
            .resolveAsResolvedSchema(new AnnotatedType(ApiProblem.class))
            .referencedSchemas
            .forEach((name, schema) -> {
                if (components.getSchemas() == null || !components.getSchemas().containsKey(name)) {
                    components.addSchemas(name, schema);
                }
            });
    }

    static void addIfAbsent(Operation operation, String code, String description) {
        if (operation.getResponses() == null) {
            operation.setResponses(new ApiResponses());
        }
        if (operation.getResponses().containsKey(code)) {
            return;
        }
        operation.getResponses().addApiResponse(code, new ApiResponse()
            .description(description)
            .content(new Content().addMediaType(
                org.springframework.http.MediaType.APPLICATION_PROBLEM_JSON_VALUE,
                new MediaType().schema(new Schema<>().$ref(API_PROBLEM_REF)))));
    }
}
