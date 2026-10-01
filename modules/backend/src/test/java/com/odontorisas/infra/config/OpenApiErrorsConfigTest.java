package com.odontorisas.infra.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.Operation;
import io.swagger.v3.oas.models.PathItem;
import io.swagger.v3.oas.models.Paths;
import io.swagger.v3.oas.models.responses.ApiResponse;
import io.swagger.v3.oas.models.responses.ApiResponses;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.method.HandlerMethod;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import static org.assertj.core.api.Assertions.assertThat;

/** Reglas de los errores transversales del contrato, sin Spring ni Docker. */
class OpenApiErrorsConfigTest {

    @Retention(RetentionPolicy.RUNTIME)
    @Target({ElementType.METHOD, ElementType.TYPE})
    @PreAuthorize("hasRole('ADMIN')")
    @interface AdminOnly {
    }

    static class Plain {
        public void open() {
        }

        @PreAuthorize("hasRole('ADMIN')")
        public void guarded() {
        }

        @AdminOnly
        public void metaGuarded() {
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    static class GuardedClass {
        public void any() {
        }
    }

    private static HandlerMethod handler(Object bean, String method) throws NoSuchMethodException {
        return new HandlerMethod(bean, bean.getClass().getMethod(method));
    }

    private static Operation apply(Object bean, String method) throws NoSuchMethodException {
        return OpenApiErrorsConfig.addOperationErrors(new Operation(), handler(bean, method));
    }

    private static OpenAPI docWith(String path, Operation operation) {
        return new OpenAPI().paths(new Paths().addPathItem(path, new PathItem().get(operation)));
    }

    @Test
    void every_operation_gets_500() throws Exception {
        Operation op = apply(new Plain(), "open");

        assertThat(op.getResponses()).containsOnlyKeys("500");
        assertThat(op.getResponses().get("500").getContent().get("application/problem+json").getSchema().get$ref())
            .isEqualTo(OpenApiErrorsConfig.API_PROBLEM_REF);
    }

    @Test
    void preauthorize_on_method_class_or_meta_annotation_adds_403() throws Exception {
        assertThat(apply(new Plain(), "guarded").getResponses()).containsKey("403");
        assertThat(apply(new GuardedClass(), "any").getResponses()).containsKey("403");
        assertThat(apply(new Plain(), "metaGuarded").getResponses()).containsKey("403");
        assertThat(apply(new Plain(), "open").getResponses()).doesNotContainKey("403");
    }

    @Test
    void private_route_gets_401_and_public_route_does_not() {
        Operation privateOp = new Operation();
        Operation publicOp = new Operation();
        OpenAPI doc = docWith("/api/recurso", privateOp);
        doc.getPaths().addPathItem("/auth/login", new PathItem().post(publicOp));

        OpenApiErrorsConfig.addUnauthorizedErrors(doc);

        assertThat(privateOp.getResponses()).containsKey("401");
        assertThat(publicOp.getResponses()).isNull();
    }

    @Test
    void explicit_responses_are_never_replaced() throws Exception {
        ApiResponse semantic401 = new ApiResponse().description("Credenciales inválidas");
        ApiResponse custom500 = new ApiResponse().description("propio");
        Operation op = new Operation().responses(new ApiResponses()
            .addApiResponse("401", semantic401).addApiResponse("500", custom500));

        OpenApiErrorsConfig.addOperationErrors(op, handler(new Plain(), "open"));
        OpenApiErrorsConfig.addUnauthorizedErrors(docWith("/api/recurso", op));

        assertThat(op.getResponses().get("401")).isSameAs(semantic401);
        assertThat(op.getResponses().get("500")).isSameAs(custom500);
    }

    @Test
    void applying_twice_does_not_duplicate() throws Exception {
        Operation op = apply(new Plain(), "guarded");
        OpenApiErrorsConfig.addOperationErrors(op, handler(new Plain(), "guarded"));
        OpenAPI doc = docWith("/api/recurso", op);
        OpenApiErrorsConfig.addUnauthorizedErrors(doc);
        OpenApiErrorsConfig.addUnauthorizedErrors(doc);

        assertThat(op.getResponses()).containsOnlyKeys("500", "403", "401");
    }

    @Test
    void api_problem_schema_is_registered_even_if_nothing_references_it() {
        OpenAPI doc = new OpenAPI();

        OpenApiErrorsConfig.addUnauthorizedErrors(doc);

        assertThat(doc.getComponents().getSchemas()).containsKey("ApiProblem");
        assertThat(doc.getComponents().getSchemas().get("ApiProblem").getRequired())
            .containsExactlyInAnyOrder("type", "title", "status", "detail", "timestamp");
    }
}
