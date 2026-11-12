# Tasks

## 1. Backend: registros

- [ ] 1.1 `GlobalExceptionHandler` registra `traceId`, clase de la excepción y clase de su causa raíz, sin mensaje; verificar con un test que provoca una violación de unicidad con un valor de prueba y comprueba que el valor no aparece en la salida registrada
- [ ] 1.2 Fijar en `WARN` `org.hibernate.SQL` y `org.hibernate.orm.jdbc.bind` en `application.yml`; verificar con un test de contexto que el nivel efectivo es `WARN` o superior
- [ ] 1.3 Test derivado del Scenario "Petición con datos en el cuerpo": guardar una historia y comprobar que ningún registro contiene el cuerpo; verificar que pasa con `mvn verify`
- [ ] 1.4 Documentar en `docs/backend.md` la política de registros (qué se registra y qué no, y que los registros de acceso del proveedor o proxy son externos); verificar que la sección enlaza la capacidad `project-foundation`

## 2. Backend y frontend: búsqueda sin datos en la URL

- [ ] 2.1 Operación `POST /api/orthodontic-records/search` con el texto en el cuerpo (validación de longitud como hoy), misma lógica de acceso por rol y misma salida que el listado; retirar `q` de `GET /api/orthodontic-records`; verificar con tests de slice de los Scenario "Buscar por nombre", "Parámetro q retirado" y "Acceso por rol en la búsqueda"
- [ ] 2.2 Regenerar `contracts/openapi.json`; verificar que `mvn verify` pasa la comparación del contrato
- [ ] 2.3 Regenerar el cliente de la API (`orval`) y adaptar `useRecords` para usar la búsqueda por `POST` cuando hay texto; verificar con los tests de listado y búsqueda existentes, actualizados para la nueva operación (Vitest + MSW)
- [ ] 2.4 Dirección del navegador sin el texto buscado: guardar el texto en `sessionStorage` de la pestaña en una clave aparte de la URL guardada para volver al listado (que no contiene el texto), conservar página y turma en la dirección y restaurar la búsqueda al recargar y al volver desde una historia (crear, vista previa, cierre de sesión borra el texto); verificar con los tests de los Scenario "Búsqueda y página en la dirección" y de "Volver al listado desde la historia" actualizados
- [ ] 2.5 Tests de frontera de `POST /api/orthodontic-records/search`: 120 y 121 caracteres, cuerpo vacío, no objeto y campos desconocidos; verificar que responden `200` o `400` como indican los Scenario "Texto en el límite" y "Cuerpo inválido"
- [ ] 2.6 Prueba e2e (Playwright) de buscar un paciente y recargar: comprobar en la red que ninguna petición, ni a la API ni del documento, lleva el texto en la URL; verificar que pasa

## 3. Integración

- [ ] 3.1 `openspec validate update-backend-logging-no-patient-data --strict`, `mvn verify` y `pnpm validate` en verde; verificar la salida de los tres
- [ ] 3.2 Marcar el change en `docs/vision.md` ("Estado de capacidades"); verificar que enlaza su `proposal.md`

## Workflow follow-up

- Abrir el PR de `change/update-backend-logging-no-patient-data` a `main`, con commits separados por scope (backend, frontend, docs).
- Archivar el change tras la revisión y, en el mismo commit, marcar la capacidad como construida en `docs/vision.md`.
