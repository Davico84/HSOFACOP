# Proposal

## Why

Hoy datos de pacientes pueden llegar a los registros por dos caminos, con cualquier proveedor de nube:

1. `GlobalExceptionHandler` escribe `ex.getMessage()` y el stacktrace de toda excepción no controlada. Los errores de base de datos suelen incluir valores (p. ej. el detalle de una violación de unicidad).
2. La búsqueda de historias usa `GET /api/orthodontic-records?q=…` y la dirección del navegador `/historias?q=…`, con el nombre o el documento del paciente en la URL. Los registros de acceso del proveedor o de un proxy guardan la URL completa con su parámetro de consulta, y el sitio estático ve la dirección del navegador cada vez que se recarga.

Ninguno depende de la decisión sobre el alojamiento ni de la revisión legal: reducen la exposición en todos los escenarios y son baratos. Este change los resuelve aparte del cifrado de la identidad (`update-orthodontic-records-encrypt-patient-identity`).

## What Changes

- `GlobalExceptionHandler` registra `traceId`, clase de la excepción y clase de su causa raíz, sin mensaje ni valores.
- Los registros de sentencias SQL y de valores enlazados de Hibernate quedan fijados en `WARN`.
- **BREAKING** — La búsqueda deja de enviarse en la URL de la API: `GET /api/orthodontic-records` pierde el parámetro `q` y la búsqueda pasa a `POST /api/orthodontic-records/search`, con el término en el cuerpo. El resto del listado (paginación, orden, turma) no cambia.
- **BREAKING** — La dirección del navegador deja de llevar el texto buscado: queda `/historias?pagina=2`, y el texto se conserva en la pestaña (`sessionStorage`) para recargar y para volver desde una historia.
- El frontend usa la nueva operación. **Contrato intermedio:** `POST /api/orthodontic-records/search` acepta transitoriamente el texto del paciente; el change `update-orthodontic-records-encrypt-patient-identity` lo reemplaza por filtros que no identifican (número, autor y turma) y quita el texto del contrato.
- Se documenta qué registran el backend y los proxies, y qué no.

## Capabilities

### New Capabilities
<!-- Ninguna. -->

### Modified Capabilities
- `project-foundation`: registros del backend sin datos de pacientes ni mensajes de excepciones con valores.
- `orthodontic-records`: el texto buscado de un paciente no viaja en la URL de la API ni en la dirección del navegador (requisito nuevo y dos requisitos modificados: "Listado y búsqueda de historias" y "Volver al listado desde la historia").

## Impact

- **Backend**: `GlobalExceptionHandler`, `OrthodonticRecordsController` (nueva operación de búsqueda, `q` retirado de `listRecords`), configuración de registros, `contracts/openapi.json`.
- **Frontend**: `useRecords` y el cliente generado de la API (`orval`).
- **Docs**: `docs/backend.md` (política de registros), `docs/vision.md`.
- **Dependencias**: ninguna.

## Non-goals

- No cifra ni cambia el almacenamiento de la identidad del paciente (change `update-orthodontic-records-encrypt-patient-identity`).
- No cambia el alojamiento ni configura los registros de acceso de ningún proveedor o proxy.
- No añade registro de auditoría de accesos a historias.

Guías perennes: `docs/backend.md`, `docs/testing.md`.

## Nota de despliegue

Este change reduce fugas por URL y registros, pero la búsqueda por `POST` sigue resolviéndose en el servidor con la identidad todavía en claro. No hace apto el hosting actual para datos reales de pacientes; eso depende de `update-orthodontic-records-encrypt-patient-identity`, que sustituye este contrato de búsqueda con un `MODIFIED` (tarea 0.4 de ese change). Mientras tanto no se cargan historias reales nuevas en el hosting restringido.
