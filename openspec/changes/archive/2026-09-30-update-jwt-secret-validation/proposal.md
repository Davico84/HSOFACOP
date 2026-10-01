## Why

Verificado: si `JWT_SECRET` no está definida (ni en el entorno ni en `secrets.properties`), Spring Boot **no falla**: deja el placeholder sin resolver y `app.security.jwt.secret` vale el texto literal `${JWT_SECRET}` (13 caracteres). `TokenService` lo usa como clave HMAC-256 sin validar nada. Así corre hoy la CI, y así correría un despliegue que olvide la variable: **cualquiera que conozca la plantilla podría firmar un JWT de `ADMIN` válido**. Lo mismo con el valor de ejemplo de `secrets.properties.example` si alguien lo copia sin cambiarlo.

## What Changes

- La aplicación **no arranca** si el secreto de firma de los tokens no es seguro: ausente o en blanco, con un placeholder sin resolver (`${…}`), igual al valor de ejemplo de `secrets.properties.example`, o de **menos de 32 bytes** (UTF-8), el mínimo para HMAC-256. El error nombra `app.security.jwt.secret` y **nunca incluye el valor** (ni en el log de arranque: la validación vive en `TokenService`, no en el binding, ver design D1).
- Los tests de contexto completo usan un **secreto de test propio** (≥ 32 bytes) registrado con `@DynamicPropertySource` en `AbstractIntegrationTest`, que gana a `secrets.properties`, al entorno y a las propiedades de sistema: la CI deja de firmar con el literal y los tests dejan de depender de la configuración de cada desarrollador.
- `secrets.properties.example` indica el requisito (≥ 32 **bytes** aleatorios, p. ej. `openssl rand -base64 48`) y cómo regenerar un secreto local corto.

## Non-goals

- Rotación de claves, varias claves activas o algoritmos asimétricos (RS256).
- Validar el resto de propiedades de seguridad (`issuer`, TTLs, CORS): se valorará aparte.
- Medir entropía real del secreto: se exigen longitud y que no sea un valor conocido.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `authentication`: ADDED "Secreto de firma de tokens obligatorio y robusto".

## Impact

- **Backend**: nuevo `infra.security.JwtSecretRules`, llamado desde el constructor de `TokenService`; `AbstractIntegrationTest` con el secreto de test.
- **Tests**: `JwtSecretRulesTest` (unit), `JwtSecretStartupTest` (`ApplicationContextRunner`, sin Docker), `JwtSecretStartupOutputTest` (salida real del arranque), `JwtSecretHermeticityIT`; los existentes siguen verdes con el secreto de test.
- **Config/Docs**: `secrets.properties.example`, `docs/backend.md` §11/§12, `docs/tooling-setup.md` si describe la CI.
- **Despliegue**: una instancia sin `JWT_SECRET` válido deja de arrancar (intencionado: hoy arranca insegura). `pnpm project:apply` ya genera 48 bytes aleatorios al crear `secrets.properties`, así que las copias nuevas no se ven afectadas.
