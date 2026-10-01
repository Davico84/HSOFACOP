> Solo backend + config + docs. Sin cambios de API ni frontend. Revisado por Codex (dos pasadas).
> Nunca imprimir ni loguear un secreto real, tampoco en tests: comparar por hash. No abrir `secrets.properties`. `Skipped: 0` se exige en CI (con Docker).

## 1. Validación (D1)

- [x] 1.1 `infra.security.JwtSecretRules.validate`: reglas y orden de D1 (null, blanco, `${`, ejemplo, < 32 bytes UTF-8), `IllegalStateException` sin el valor
- [x] 1.2 `TokenService` llama a `JwtSecretRules.validate(props.jwt() == null ? null : props.jwt().secret())` en su constructor antes de `Algorithm.HMAC256`
- [x] 1.3 `JwtSecretRulesTest` (unit): un caso por regla (mensaje con la propiedad y sin el valor), multibyte ≥ 32 bytes válido, aleatorio válido; sincronía con `secrets.properties.example` (rechazado por la regla de ejemplo, no por longitud, y con ≥ 32 bytes)
- [x] 1.4 `JwtSecretStartupTest` (`ApplicationContextRunner` + `TokenService`): sin ninguna `app.security.jwt.*` (sin `NullPointerException`), `secret` sin definir, placeholder literal, corto → no arranca con el mensaje de su regla y la cadena de errores no contiene el valor; válido → arranca y firma/verifica; cada inválido comprobado fallando
- [x] 1.5 `JwtSecretStartupOutputTest` (`OutputCaptureExtension` + `SpringApplication` mínima): la salida real del arranque fallido nombra la propiedad y no contiene el valor

## 2. Tests herméticos (D2, D3)

- [x] 2.1 `AbstractIntegrationTest`: `@DynamicPropertySource` con `app.security.jwt.secret = TEST_JWT_SECRET` (≥ 32 bytes)
- [x] 2.2 `JwtSecretHermeticityIT`: secreto efectivo == test (por hash) en la ejecución normal
- [x] 2.3 `JwtSecretHermeticityIT` ejecutado con `-DJWT_SECRET=…` y `-Dapp.security.jwt.secret=…` contaminantes vía Maven → sigue siendo el de test
- [x] 2.4 Simular CI: suite sin `secrets.properties` ni `JWT_SECRET` → verde con el secreto de test
- [x] 2.5 `./mvnw -B verify` verde (y `Skipped: 0` con Docker)

## 3. Docs y cierre

- [x] 3.1 `secrets.properties.example`: requisito de 32 bytes aleatorios y cómo generarlo
- [x] 3.2 `docs/backend.md` §11 (reglas, validación en `TokenService` y por qué) y §12 (consecuencias de rotar/réplicas)
- [x] 3.3 `docs/tooling-setup.md`: migración de un `secrets.properties` con secreto corto o de ejemplo (sustituir a mano con `openssl rand -base64 48`)
- [x] 3.4 Prueba manual: con el `secrets.properties` local la app arranca; con `JWT_SECRET` corto no arranca y el log nombra la propiedad sin el valor
- [x] 3.5 `openspec validate update-jwt-secret-validation --strict`
