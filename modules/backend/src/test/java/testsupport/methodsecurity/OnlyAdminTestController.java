package testsupport.methodsecurity;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller de prueba SOLO para {@code MethodSecurityTest}. Deliberadamente FUERA del árbol
 * {@code com.odontorisas} (que es lo que escanea {@code @SpringBootApplication}): si viviera ahí,
 * cualquier otro test de contexto completo (ej. {@code ContractDriftIT}) lo levantaría también y
 * contaminaría el OpenAPI real publicado con esta ruta — pasó exactamente eso al primer intento.
 */
@RestController
public class OnlyAdminTestController {

    @GetMapping("/__test/only-admin")
    @PreAuthorize("hasRole('ADMIN')")
    public String hello() {
        return "ok";
    }
}
