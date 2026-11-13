package testsupport.errors;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Controller solo para {@code ErrorFallbackTest}. Vive fuera de {@code com.odontorisas}
 * para que ningún test de contexto completo lo escanee (contaminaría el OpenAPI real que
 * vigila {@code ContractDriftIT}); se registra como {@code @Bean} explícito.
 */
@RestController
public class ErrorsTestController {

    /** Error que resuelve el padre (ResponseStatusException → handleExceptionInternal). */
    @GetMapping("/__test/status/{code}")
    public void status(@PathVariable int code) {
        throw new ResponseStatusException(HttpStatus.valueOf(code), "texto interno");
    }

    @GetMapping("/__test/boom")
    public void boom() {
        throw new IllegalStateException("secreto");
    }

    /** Excepción cuyo mensaje y el de su causa raíz llevan un valor de paciente (para el test de registros). */
    @GetMapping("/__test/boom-with-cause")
    public void boomWithCause() {
        throw new IllegalStateException("fallo con valor-externo-12345678",
            new java.sql.SQLException("Key (document)=(valor-raiz-87654321) already exists"));
    }
}
