package testsupport.openapi;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Solo para {@code OpenApiTransversalErrorsIT}: una ruta privada y otra con rol, que la API
 * real todavía no tiene. Vive fuera de {@code com.odontorisas} (ningún otro contexto la
 * escanea, así no aparece en el {@code /v3/api-docs} de {@code ContractDriftIT}).
 */
@RestController
public class TransversalErrorsTestController {

    @Operation(operationId = "testPrivate")
    @ApiResponse(responseCode = "200", description = "OK")
    @GetMapping("/api/__test/private")
    public ResponseEntity<String> privateRoute() {
        return ResponseEntity.ok("ok");
    }

    @Operation(operationId = "testAdmin")
    @ApiResponse(responseCode = "200", description = "OK")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/api/__test/admin")
    public ResponseEntity<String> adminRoute() {
        return ResponseEntity.ok("ok");
    }
}
