> Backend + contrato + frontend, commits separados por scope (docs/commits.md). Los `*IT` necesitan Docker (Testcontainers): `Skipped: 0`. Antes de tocar el frontend, skill `frontend-guard`.
> Regenerar el contrato: `./mvnw -B verify -Dit.test=ContractDriftIT -Dtest=none -Dsurefire.failIfNoSpecifiedTests=false -Dcontract.update=true` y después `pnpm generate:api`.

## 1. Backend — modelo y persistencia (D1, D2, D5)

- [x] 1.1 `V8__orthodontic_records.sql`: tabla `orthodontic_records` (columnas de D1, `content JSONB NOT NULL DEFAULT '{}'`, `version`, FK `author_id`), `UNIQUE (author_id, record_seq)`, `CHECK` de `document_type` e índices `(author_id, updated_at DESC)` y `(updated_at DESC)`
- [x] 1.2 Records de contenido + enums por paso (`RecordContent` con `schemaVersion`, `Anamnesis`, `FacialAnalysis`, `FunctionalAnalysis`, `OcclusalAnalysis`, `RadiographicAnalysis`, `Diagnosis`, `Signatures`) con el catálogo de D3; comentario en los enums: "solo añadir valores"
- [x] 1.3 Entidad `OrthodonticRecord` (`@JdbcTypeCode(SqlTypes.JSON)` en `content`, `@Version`, `author` `@ManyToOne(fetch = LAZY)`), `OrthodonticRecordRepository` y `OrthodonticRecordSpecifications` (alcance por autor + `search_text LIKE`)
- [x] 1.4 `common.text.SearchNormalizer` (minúsculas, sin diacríticos) + test unitario
- [x] 1.5 Test de repositorio (Testcontainers): ida y vuelta del JSONB, `UNIQUE (author_id, record_seq)` (mismo correlativo en otro autor sí se permite), búsqueda sin tildes ("quispe" ↔ "QUÍSPE"), alcance por autor y orden por `updated_at`

## 2. Backend — servicio (D4, D6, D8)

- [x] 2.1 `service.records.RecordAgeCalculator` (edad a la fecha de inicio o a hoy, `null` sin nacimiento; `Clock` inyectable) + test con los scenarios de "Datos del paciente con edad calculada"
- [x] 2.2 `service.records.RecordNormalizer`: recorta, `""` → `null`, descarta condicionados (menarquia si sexo ≠ FEMALE, rasgos de Patrón II/III, `tongueLateralSides`, hábitos de succión si la anamnesis dice "no" → solo "no", `crossbiteSide`, `bruxismTeeth` (solo FDI 11–48 / 51–85), overjet y mordida cruzada anterior si AP = normal, `deviationMm` si centrada, relaciones en RC si no se marcó MI/MIH ≠ RC, `familyMalocclusionWho`, firmante (apoderado si < 18, paciente si no), ítems vacíos de las listas, `deepBitePercent`, `openBiteMm`, detalle de Spee) + test por cada condición
- [x] 2.3 `service.records.OrthodonticRecordService`: `create` (autor = usuario actual, tratante = `fullName` por defecto), `get`, `update` (comprueba `version` antes de copiar → conflicto; normaliza; recalcula `search_text`), `list` (paginado, `ADMIN` sin filtro / `USER` por autor); las reglas de fechas y documento son validación del request (3.1)
- [x] 2.4 Excepciones con su `ProblemDetail`: `RecordNotFoundException` (404), `StaleRecordException` (409, `/errors/stale-record`, también desde `ObjectOptimisticLockingFailureException`)
- [x] 2.5 `OrthodonticRecordServiceTest`: creación, alcance USER/ADMIN (ajena → 404), versión desactualizada → 409, correlativo (`AEO-001` primero, independiente por autor, `AEO-1000`, número enviado ignorado), autor conservado cuando guarda un ADMIN

## 3. Backend — API y contrato (D7)

- [x] 3.1 DTOs en `presentation.dto`: `CreateRecordRequest`, `UpdateRecordRequest` (con `version`), `RecordResponse` (con `ageYears`), `RecordSummaryResponse` (con `authorName`); Bean Validation con los límites de D2 (≤ 200 / ≤ 4000 / 0–100 % / 0–30 mm) + restricciones de clase: documento según su tipo, nacimiento no futuro, inicio ≥ nacimiento
- [x] 3.2 `OrthodonticRecordsController` (`/api/orthodontic-records`: `GET` lista con `q`, `page` y `size` explícitos y orden fijo `updatedAt DESC` (como `UsersController`), `POST`, `GET /{id}`, `PUT /{id}`), `@PreAuthorize("isAuthenticated()")`, `operationId` y `@ApiResponse` 200/201/400/404/409
- [x] 3.3 `OrthodonticRecordsControllerTest` (`@WebMvcTest`): 401 sin sesión, 400 por campo (nombre vacío, longitudes, rangos, fechas), 201/200, 404, 409 con su `type`
- [x] 3.4 `OrthodonticRecordsIT` (flujo completo con Testcontainers): USER crea, edita y lista solo las suyas; otro USER recibe 404 al leer y al guardar; ADMIN lista todas con autor y guarda conservando el autor; dos guardados con la misma versión → el segundo 409 sin modificar; condicionados descartados al guardar
- [x] 3.5 `OpenApiContractIT`: operationIds y schemas nuevos; regenerar `contracts/openapi.json`; `ContractDriftIT` verde; `./mvnw -B verify` verde, `Skipped: 0`

## 4. Frontend — base del módulo (D3, D9)

- [x] 4.1 `pnpm generate:api` (`orthodontic-records.ts` + modelos) — commit aparte con el contrato
- [x] 4.2 Sección "Historias clínicas": `PATHS.RECORDS`, `sections.ts` (sin `roles`), `navItems` (icono lucide `ClipboardList`), rutas de lista, formulario e impresión (esta última fuera del layout privado, protegida)
- [x] 4.3 `modules/records/config/options.ts`: etiquetas en español de cada enum (única fuente para wizard e impresión) + test de que cubre todos los valores del modelo generado
- [x] 4.4 Schemas Zod por paso y compuesto, con paridad de límites con el backend (docs/coding-style.md §7) + tests de los límites y de las reglas de fechas
- [x] 4.5 `utils/age.ts` (misma fórmula que el backend) + test con los scenarios de edad
- [x] 4.6 Hooks React Query: `recordKeys`, `useRecords(q, page)`, `useRecord(id)`, `useSaveRecord` (crea o guarda; actualiza el detalle e invalida la lista; el 409 de versión se distingue por `type`), `useLeaveGuard`

## 5. Frontend — listado y wizard (spec: listado, formulario por pasos, secciones, concurrencia)

- [x] 5.1 `RecordsListScreen`: tabla paginada (número, paciente, documento, tratante, inicio, modificado; "Autor" solo para ADMIN), búsqueda con debounce, estados de carga, error con "Reintentar", vacío inicial ("Nueva historia") y vacío de búsqueda ("Limpiar búsqueda")
- [x] 5.2 `RecordFormScreen`: crear (`/historias/nueva` → POST → `/historias/:id?paso=1`) y editar; indicador de 7 pasos clicable; paso en `?paso=`; "Anterior/Siguiente" validan el paso y guardan solo si hay cambios (`isDirty`), `reset(response)` tras guardar; se queda en el paso si falla
- [x] 5.3 Componentes de campo reutilizables: `ChoiceField` (única, con deseleccionar), `ImageChoiceField` (tarjetas con imagen de la guía), `FieldHint` (valor de referencia), `MultiChoiceField`, `NoteField` (texto largo con contador), `MeasureField` (número + unidad), `SidePairField` (derecho/izquierdo), `ChoiceMatrix` (filas × opciones, musculatura), `ToothPicker` (FDI permanentes 11–48 + temporales 51–85), `ItemListField` (agregar/quitar/reordenar ítems; lista de problemas y metas)
- [x] 5.4 Pasos 1–7 (`Step1Patient` … `Step7Signatures`) con el catálogo de D3; condicionados ocultos (menarquia, lado de mordida cruzada, piezas con desgaste, % / mm de mordida, detalle de Spee); edad de solo lectura
- [x] 5.5 Salida con cambios sin guardar: `useBlocker` + `beforeunload` + `AlertDialog`; banner de 409 por versión con "Recargar historia" / "Seguir editando"; "Historia no encontrada" con enlace al listado ante 404
- [x] 5.6 Tests Vitest + MSW: listado (USER sin columna Autor, ADMIN con ella, búsqueda, ambos vacíos, error); wizard (avanzar guarda, sin cambios no hay petición, saltar desde el indicador, error de validación y de red se queda en el paso, selección única y múltiple, condicionados aparecen y se ocultan, salir con cambios pide confirmación, 409 muestra el banner, 404 muestra el aviso)

## 6. Frontend — impresión (D10, spec: impresión)

- [x] 6.1 Copiar a `src/assets/records/` los logos (`logo-aeo.png` recortado del PDF, `logo-facop.webp` oficial) y las ilustraciones de la guía facial (`facial-guide/*.png`), ya extraídas en `docs/pdf/` durante la revisión (D12)
- [x] 6.2 Componentes `PrintPage` (cabecera con logos y "HISTORIA CLÍNICA ORTODONCIA Nro."), `PrintField` (valor o línea en blanco), `PrintChoice` (☒/☐ con todas las opciones), `PrintLines` (texto largo con líneas mínimas)
- [x] 6.3 `RecordPrintScreen` con las 7 secciones en el orden y títulos del PDF; CSS `@page A4`, `break-before: page` por sección, texto largo que fluye; `window.print()` al terminar de cargar; botón "Imprimir" en el formulario y en el listado
- [x] 6.4 Tests Vitest: opción marcada (☒ Mesofacial ☐ …), vacíos como línea sin "null/undefined", menarquia oculta si no aplica, 404 sin contenido
- [x] 6.5 E2E Playwright (`e2e/records.backend.spec.ts`, con `E2E_BACKEND=1` y backend real; smoke sin API en CI): crear una historia, llenar campos de varios pasos, abrir la impresión y generar `page.pdf()` comprobando número de páginas y textos clave
- [x] 6.6 `pnpm validate` verde

## 6b. Ajustes de la revisión del usuario

- [x] 6b.1 Botón de imprimir: valores iniciales completos (abrir un paso no cuenta como cambio); impresión con las medidas del PDF y página sin margen propio (igual que la vista previa)
- [x] 6b.2 Análisis facial: tercios y simetrías = presenta / no presenta + texto (`V9`, `schemaVersion` 2); impresión vertical de 3, 5, 6 y 7

- [x] 6b.3 Impresión: regla de saltos de línea (":" → opciones en el renglón siguiente, juntas si caben) y vista preliminar con botón "Imprimir" (sin diálogo automático)
- [x] 6b.4 Anamnesis: textos vacíos se imprimen "No refiere" (y el formulario lo muestra como ayuda)
- [x] 6b.5 Impresión sin líneas de llenado a mano en los datos escritos (solo fecha y firmas conservan su línea)
- [x] 6b.6 Impresión: preguntas y etiquetas en 11 pt para distinguirlas de las respuestas (10 pt)
- [x] 6b.7 Vista previa en la misma pestaña con "Volver" al origen; búsqueda y página del listado en la URL
- [x] 6b.8 Hoja 1: los datos del paciente (PACIENTE a Celular) conservan su línea como en el PDF

## 7. Docs y cierre

- [x] 7.1 `docs/vision.md`: producto (historia clínica de ortodoncia FACOP/ARO), roadmap con `orthodontic-records` y las fases 2–3, estado 🚧 enlazando este change
- [ ] 7.2 Al archivar — `docs/domain.md`: actores tratante (`USER`) y supervisor (`ADMIN`), glosario (anamnesis, overjet, Brodie, curva de Spee…), entidad `OrthodonticRecord` en texto y ER
- [ ] 7.3 Prueba manual: llenar una historia real del PDF de punta a punta, imprimirla en Chrome y Edge y compararla con el PDF; USER no ve historias de otro; ADMIN sí
- [x] 7.4 `openspec validate add-orthodontic-records --strict`
