## Context

Primera capacidad de negocio sobre la plantilla (auth, app-shell, `users` ya construidos). El origen es el PDF `docs/pdf/HISTORIA CLINICA PARA MODULO ORTODONCIA.pdf` (14 págs., no versionado: `docs/pdf/` está en `.gitignore`). Esta fase cubre las págs. 1–4 y 10–13 (~110 campos de texto y selección). Las tablas de análisis de modelos (págs. 5–7, 9) y las notas de evolución (pág. 14) quedan para changes posteriores, así que el modelo debe crecer sin rehacer lo de esta fase.

Restricciones: stack cerrado (docs/architecture.md), capas estrictas y `PageResponse` (docs/backend.md §1, §5.1), bloqueo optimista (§8.3), errores `ProblemDetail` y contrato fiel (§10), Testcontainers y no H2 (docs/testing.md), front orientado a pantallas con React Query + react-hook-form + Zod (docs/frontend.md), paridad Zod ↔ Bean Validation (docs/coding-style.md §7). Sin dependencias nuevas.

Actores: **tratante** (alumno/odontólogo, rol `USER`) llena sus historias; **supervisor** (docente, rol `ADMIN`) revisa y corrige cualquiera.

## Goals / Non-Goals

**Goals:**
- Persistir una historia por paciente con columnas para lo que se lista o busca y el contenido clínico tipado.
- Wizard de 7 pasos con guardado al cambiar de paso, sin perder datos ni pisar ediciones concurrentes.
- Impresión A4 fiel al PDF, desde el navegador.
- Dejar el modelo listo para añadir las secciones de las fases 2 y 3.

**Non-Goals:** ver "Non-goals" del proposal (modelos/Moyers/Nance/Bolton, evolución, adjuntos, firma digital, registro maestro de pacientes, borrado, estados de aprobación, PDF en servidor).

## Decisions

### D1. Columnas para identidad/búsqueda + JSONB tipado para el contenido clínico
Tabla `orthodontic_records`:

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `BIGSERIAL` PK | |
| `author_id` | `BIGINT NOT NULL` FK `users` | autor; nunca cambia |
| `record_seq` | `INT NOT NULL` | correlativo del autor; `UNIQUE (author_id, record_seq)` (D11) |
| `record_number` | `VARCHAR(20) NOT NULL` | `AEO-` + `record_seq` con 3 cifras mínimo (`AEO-001`); derivado, no editable |
| `treating_dentist` | `VARCHAR(120)` | por defecto `fullName` del autor |
| `patient_name` | `VARCHAR(120) NOT NULL` | |
| `document_type` | `VARCHAR(20)` | `DNI` \| `FOREIGNER_CARD` \| `PASSPORT`; ambos o ninguno con el número |
| `document_number` | `VARCHAR(12)` | DNI `^\d{8}$` · CE `^\d{9}$` · Pasaporte `^\d{6,12}$` (solo dígitos, confirmado por la clínica) |
| `patient_sex` | `VARCHAR(10)` | `FEMALE` \| `MALE` |
| `birth_date`, `treatment_start_date` | `DATE` | |
| `birth_place` | `VARCHAR(120)` | |
| `address` | `VARCHAR(200)` | |
| `phone` | `VARCHAR(20)` | |
| `search_text` | `VARCHAR(400) NOT NULL` | nombre + documento + número normalizados (D5) |
| `content` | `JSONB NOT NULL DEFAULT '{}'` | secciones clínicas (D2) |
| `version` | `BIGINT NOT NULL DEFAULT 0` | `@Version` (D4) |
| `created_at`, `updated_at` | `TIMESTAMPTZ` | |

Índices: `(author_id, updated_at DESC)` para el listado del `USER`, `(updated_at DESC)` para el del `ADMIN`.

**Por qué**: nada consulta los campos clínicos (solo se leen e imprimen con la historia completa), son ~110 y van a cambiar a medida que se afine el PDF. **Alternativas**: (a) una columna por campo → ~110 columnas y una migración por cada ajuste de etiqueta u opción; (b) una tabla por sección → 7+ tablas 1:1 y joins sin beneficio. JSONB mantiene el esquema físico estable y el contrato sigue tipado (D2).

### D2. Contenido tipado de punta a punta
`content` es JSONB; en la entidad es un `String` con `@JdbcTypeCode(SqlTypes.JSON)` (la persistencia no conoce su forma, regla de ArchUnit) y el service lo convierte con el `JsonMapper` de Spring a un record Java `RecordContent` con un record por paso (`Anamnesis`, `FacialAnalysis`, `FunctionalAnalysis`, `OcclusalAnalysis`, `RadiographicAnalysis`, `Diagnosis`, `Signatures`) y enums para cada selección. Los mismos records (como DTO en `presentation.dto`) llevan Bean Validation (`@Size`, `@DecimalMin/Max`) y springdoc los publica en el contrato, así que orval genera los tipos del front y el schema Zod refleja las mismas reglas. Lleva `schemaVersion: 1` para migrar el JSON en fases futuras (un componente de lectura que actualice versiones antiguas, si llega a hacer falta).
- Nuevas secciones (fase 2: `modelAnalysis`; fase 3: evolución en tabla propia porque es una lista que crece) se añaden como campos opcionales: las historias existentes las leen como `null`.
- Límites: texto corto ≤ 200, texto largo ≤ 4000, porcentaje 0–100, milímetros 0–30 con un decimal (desviación de línea media: mínimo 0,5 mm).

### D3. Catálogo de campos por paso (fase 1)
Leyenda: **U** = selección única · **M** = múltiple · **T** = texto corto · **L** = texto largo · **N** = número. "+ nota" = texto largo asociado. Condicionados en *cursiva*.

1. **Paciente y anamnesis** *(revisada con el usuario)* — columnas de D1 (documento = tipo U + número; sexo U, añadido porque lo usa la pág. 5 y la menarquia) + `chiefComplaint` L · `personalPreferences` L · `cooperation` U (alto/medio/bajo, sin nota) · `oralHygiene` U (sí/no) · `suckingHabits` U (sí/no; el detalle va en el paso 3) · *`menarche` U (sí/no), solo si sexo = FEMALE* · `medicalHistory` L · `accidentsHistory` L · `familyStructure` L · `generalTreatmentNeeds` L · `heredity` L.
2. **Análisis facial** *(revisada con el usuario; opciones de la "Guía de análisis facial", D12; sin notas libres)* — `facialType` U (meso/dolico/braqui) · `convexity` U (recto/convexo/cóncavo) · `facialThirds` U (presenta / no presenta) + `facialThirdsNotes` L · `lipSeal` U (presenta/no) · `lipAnteroposteriorRelation` U (superior adelante / misma línea / inferior adelante) · `restSymmetry` U (presenta/no) + `restSymmetryNotes` L · `openingSymmetry` U (presenta/no) + `openingSymmetryNotes` L (el lado asimétrico se escribe en el texto; revisión posterior del usuario, `schemaVersion` 2) · `nasolabialAngle` U (normal/abierto/disminuido) · `mentolabialSulcus` U (normal/profundo/poco profundo) · `zygomaticProjection` U (disminuida/normal/aumentada) · `chinNeckLine` U (normal/aumentada/disminuida) · `chinNeckAngle` U (normal/abierto/cerrado) · `facialPattern` U (I/II/III/cara corta/cara larga) + *solo Patrón II: `patternIIFeatures` M (retrusión mandibular/protrusión maxilar) y `patternIIAfai` U (aumentada/disminuida, excluyentes)* + *solo Patrón III: `patternIIIFeatures` M (protrusión mandibular/retrusión maxilar) y `patternIIIAfai` U (aumentada/disminuida)*.
3. **Análisis funcional** *(revisada con el usuario; sin observaciones libres)* — `breathing` U (bucal/nasal/mixta) · `swallowing` U (normal/atípica) · `lipClosure` U (normal/contracción) · `tongueActivity` U (normal/interp. anterior/interp. lateral) + *`tongueLateralSides` M (derecho/izquierdo), solo interp. lateral* · `upperLip`, `lowerLip`, `masseter`, `mentalis` U (normal/hipoactivo/hiperactivo; en el form, una tabla de 4 filas) · `suckingHabitTypes` M (no/dedos/lengua/labios/onicofagia; "no" excluye al resto y viene marcado por defecto; si en el paso 1 `suckingHabits` = no, queda fijo en "no") · `lingualFrenulum` U (normal/corto; junto a "Corto" se imprime el texto fijo "* Examen del corazón.", referencia a la prueba de frenillo lingual, y el form lo muestra como ayuda) · `snoring` U (sí/no) · `bruxism` U (no presenta/sin desgastes/con desgastes) · *`bruxismTeeth` M de piezas FDI (permanentes 11–48 y temporales 51–85), solo con desgastes; se imprime como lista ordenada "13, 16, 23, 26"*.
4. **Análisis oclusal y extra** *(revisada con el usuario)* — `transverse` U (normal / cruzada post. bilateral / cruzada post. unilateral / Brodie; una sola) + *`crossbiteSide` U (derecho/izquierdo), solo unilateral* · `crossbiteType` U (esqueletal / dento-alveolar / no presenta; una sola) · `vertical` U (normal / borde a borde / profunda / abierta) + *`deepBitePercent` N %, solo profunda* + *`openBiteMm` N mm, solo abierta* · `speeCurve` U (normal/alterada) + *`speeCurveDetail` T, solo alterada* · `anteroposteriorNormal` (casilla; excluye a los dos siguientes) · *`overjetMm` N mm* · *`anteriorCrossbiteTeeth` M FDI, solo anteriores (13–23, 33–43, 53–63, 73–83)* · `midline` {superior, inferior} × {`position` U (centrada / desviada a la derecha / desviada a la izquierda), *`deviationMm` N ≥ 0,5 mm, solo desviada*} · `canineRelation`, `molarRelation` {derecho, izquierdo} × {`angleClass` U (Clase I / II / III), `detail` T (fracción u observación, p. ej. "½ cúspide")} · *`canineRelationMi` {derecho, izquierdo} igual que arriba, solo si `miDiffersFromRc` (máxima intercuspidación ≠ RC)* · *`canineRelationMih` ídem, solo si `mihDiffersFromRc` (mordida habitual ≠ RC)* · `dentalAnomalies` L · `tmjCondition` L · `familyMalocclusion` U (sí/no) + *`familyMalocclusionWho` T, solo sí*.
5. **Análisis radiográfico** *(revisada con el usuario)* — `panoramicDiagnosis` L · `cephalometricAnalyses` M (Steiner / Ricketts / McNamara / Wits; el PDF pide 3: el form muestra "n de 3" como ayuda, sin bloquear el borrador) · `apicalBases`, `growthTendency`, `dentoalveolar`, `others` L.
6. **Diagnóstico y planes** *(revisada con el usuario)* — `generalDiagnosis` L · `problemList` y `treatmentGoals`: **listas** de ítems T (≤ 500 c/u, máx. 30), se agregan/quitan/reordenan uno por uno y se imprimen numeradas · `treatmentPlan1`, `treatmentPlan2` L (dos planes alternativos, como los dos bloques del PDF) · `treatmentSequence`, `nextStages`, `finalTreatmentPlan` L.
7. **Firmas** *(revisada con el usuario)* — sin campo de fecha: se imprime "FECHA: ____" para llenarla a mano · firmante del paciente: si la edad calculada es < 18, *`guardianName` T + `guardianRelationship` T (parentesco)* y se imprime "FIRMA DEL APODERADO"; si no (o sin fecha de nacimiento), `patientSignatureName` T (propone el nombre del paciente) · `supervisor1Name`, `supervisor2Name` T (escritos a mano, no se eligen de usuarios) · `treatingSignatureName` T (propone `treatingDentist`). Las firmas se hacen sobre el papel.

Las etiquetas de cada opción viven en un único mapa del front (`records/config/options.ts`) que usan el wizard y la impresión.

### D4. Guardado completo con versión y `409`
`PUT /api/orthodontic-records/{id}` recibe la historia completa (columnas + `content` + `version`). El service compara `request.version` con la versión cargada **antes** de copiar los campos (si solo se confiara en `@Version`, la entidad recién leída ya tendría la versión actual y nunca habría conflicto) y lanza conflicto → `409`; `@Version` además cubre la carrera entre lectura y commit (`ObjectOptimisticLockingFailureException` → `409`). Guardar completo en vez de por sección (`PATCH /sections/{x}`) es más simple, idempotente y suficiente: la historia pesa unos pocos KB.

El service **normaliza** antes de guardar: recorta espacios, convierte cadenas vacías a `null` y descarta los campos condicionados cuya condición no se cumple (D3). Así la regla vive en un solo sitio y el front solo oculta.

### D5. Búsqueda sin tildes con columna normalizada
`search_text` = `patient_name + " " + document_number + " " + record_number`, en minúsculas y sin diacríticos (`java.text.Normalizer` NFD + quitar marcas), recalculado en cada guardado. La búsqueda normaliza el término igual y usa `LIKE %term%` mediante `Specification`. **Alternativa** descartada: extensión `unaccent` de PostgreSQL (crearla exige permisos sobre la BD y hay que replicarla en Testcontainers); a este volumen (cientos o pocos miles de historias por sede) no hace falta un índice trigram.

### D6. Autorización en el service, `404` para lo ajeno
`@PreAuthorize("isAuthenticated()")` en el controller. El service resuelve el alcance: `ADMIN` → sin filtro; `USER` → `author_id = currentUser`. Lectura y guardado usan `findById` filtrado por alcance, de modo que una historia ajena da `404` (no `403`), lo que no revela su existencia. El listado aplica el mismo filtro en la `Specification`. `author_id` no se acepta en el request.

### D7. API

| Método | Ruta | Respuesta |
|---|---|---|
| `GET` | `/api/orthodontic-records?q=&page=&size=` | `200 PageResponse<RecordSummaryResponse>` (incluye `authorName`) |
| `POST` | `/api/orthodontic-records` | `201 RecordResponse` · `400` |
| `GET` | `/api/orthodontic-records/{id}` | `200 RecordResponse` · `404` |
| `PUT` | `/api/orthodontic-records/{id}` | `200 RecordResponse` · `400` · `404` · `409` (versión, `/errors/stale-record`) |

Los requests no llevan `recordNumber` ni `authorId` (los asigna el servidor).

`RecordResponse` incluye `ageYears` calculada en el service (D8). Contrato y cliente orval se regeneran en commit aparte.

### D8. Edad calculada en el backend
`ageYears = Period.between(birthDate, treatmentStartDate ?? hoy).getYears()`, `null` sin fecha de nacimiento. Se calcula en un único sitio (service) y se devuelve; el front la muestra al recargar tras guardar. Mientras se edita, el wizard la previsualiza con la misma fórmula (función pura con test).

### D9. Frontend: un formulario, siete pasos
- Campos genéricos en `core/components/form/` (`ChoiceField` con tarjetas de imagen, `MultiChoiceField`, `MeasureField`, `ChoiceMatrix`, `ItemListField`, `CheckboxField`, `TextField`, `TextAreaField`); los del dominio (`ToothPickerField`, `RelationsField`, `MidlineField`) en `modules/records/components/fields/`.
- `modules/records/`: `schemas/` (Zod de toda la historia; cada paso valida sus campos con `trigger`), `hooks/` (`useRecords`, `useRecord`, `useSaveRecord`, `useLeaveGuard`), `components/steps/Step1…Step7`, `components/print/`, `config/options.ts`.
- `screens/records/`: `RecordsListScreen` (`/historias`), `RecordFormScreen` (`/historias/nueva` y `/historias/:id?paso=N`), `RecordPrintScreen` (`/historias/:id/imprimir`).
- Un único `useForm` para toda la historia; cada paso valida solo sus campos (`trigger(stepFields)`) y "Siguiente/Anterior/indicador" ejecuta `save` solo si `formState.isDirty`; tras guardar, `reset(response)` deja la nueva `version` y limpia el dirty. El paso actual va en la URL (`?paso=`) para recargar sin perderlo.
- Salida con cambios: `useBlocker` de react-router v7 + `beforeunload`, con `AlertDialog` de `core/ui`.
- `409` de versión: banner con "Recargar historia" (refetch y se vuelve a montar el formulario con la versión del servidor) o "Seguir editando".
- Sección `{ id: "records", path: PATHS.RECORDS }` sin `roles` (todos los autenticados); el alcance real lo aplica el backend (D6).

### D10. Impresión con CSS de impresión, ruta fuera del shell
`RecordPrintScreen` se monta en una ruta protegida **sin** el layout privado (sin menú ni cabecera), en la misma pestaña (no se acumulan pestañas; el enlace guarda de dónde se vino y "Volver" regresa ahí; la búsqueda y la página del listado viven en la URL), carga la historia y la muestra como vista preliminar (hojas A4); el diálogo del navegador se abre solo con el botón "Imprimir" (revisión del usuario: imprimir directo obligaba a cancelar para revisar). Con `@page { size: A4; margin: 15mm }`, `break-before: page` por sección y `break-inside: avoid` en filas cortas, los textos largos fluyen a la página siguiente. Jerarquía tipográfica (revisión del usuario): títulos de sección 12 pt negrita, preguntas y etiquetas 11 pt (`LABEL` en `printStyle.ts`), respuestas 10 pt (Arial). Los datos escritos se imprimen como texto sin las líneas del PDF (eran para llenar a mano; revisión del usuario); solo la fecha y las firmas, que se llenan sobre el papel, llevan línea. Un texto largo fluye a la hoja siguiente. Componentes de impresión: `PrintField` (valor como texto; línea solo si es `handwritten`), `PrintChoice` (☒/☐ con todas las opciones), `PrintLines` (texto largo sin renglones; `emptyText` para "No refiere"). Los logos ARO y FACOP se extraen del PDF a `src/assets/records/` (PNG a 300 ppp) y se repiten en cada página mediante una cabecera por sección. Para ajustar la presentación (tipografía, interlineado) se usan tokens del tema, pero en blanco y negro, para que la impresión sea legible en impresoras monocromo.
**Alternativa** descartada: PDF en servidor (OpenPDF/Flying Saucer): una dependencia nueva y una plantilla paralela que mantener; el navegador ya ofrece "Guardar como PDF".

### D12. Imágenes de referencia y logos
- **Guía de análisis facial** (`docs/pdf/GUÍA DE ANÁLISIS FACIAL imagen.pdf`): sus ilustraciones se recortan a PNG (200 ppp) y viven en `src/assets/records/facial-guide/`; el paso 2 las usa como tarjetas seleccionables (tipo facial, convexidad, labios, proyección cigomática, patrón facial) o como imagen de referencia junto a las opciones (tercios, sellado, simetría, ángulos, surco). Cada pregunta muestra el texto de referencia de la guía (valores normativos) como ayuda. Las etiquetas, textos de ayuda e imágenes viven en `records/config/options.ts` (D3).
- ⚠️ `docs/pdf/` está en `.gitignore`: los PNG/WebP extraídos durante la revisión solo existen en la máquina local; la tarea 6.1 los copia a `modules/frontend/src/assets/records/`, que sí se versiona.
- **Logos**: AEO (recortado del PDF de la historia) y FACOP (`logo-positivo-registrado`, sitio oficial de FACOP) en `src/assets/records/`. Aparecen en la cabecera de cada página impresa.
- Las imágenes **no se imprimen** (decisión de la revisión): la página de análisis facial se imprime en blanco y negro, solo casillas, y SHALL caber en una hoja A4. Regla de impresión de opciones (revisión del usuario): pregunta que termina en ":" → opciones en el renglón siguiente; juntas si caben en un renglón, si no una por renglón (`PrintChoice` + `printLayout.ts`). 3, 6 y 7 con 2 renglones para el texto.

### D11. Correlativo por autor con bloqueo de la fila del usuario
Al crear, el service bloquea la fila del autor (`UserRepository.findByIdForUpdate`, `PESSIMISTIC_WRITE`, ya existente) y calcula `MAX(record_seq) + 1` de ese autor en la misma transacción; así dos creaciones simultáneas del mismo usuario se serializan y no chocan. `UNIQUE (author_id, record_seq)` es la red de seguridad. `record_number` se formatea una vez (`"AEO-%03d"`) y se guarda para listar y buscar sin recalcular. **Alternativas**: secuencia de PostgreSQL (una por usuario no escala; una global no da correlativo por usuario); reintento ante violación del `UNIQUE` (funciona, pero el bloqueo es más simple y la contención es mínima: un usuario crea pocas historias a la vez).

## Risks / Trade-offs

- [El JSONB no tiene integridad referencial ni restricciones en BD] → Validación completa en el DTO (Bean Validation) + normalización en el service; test de ida y vuelta del JSON en Testcontainers.
- [Cambiar un enum (renombrar una opción) rompería historias guardadas] → Enums solo se **añaden**; renombrar exige migración del JSON con `schemaVersion`. Documentado en el código del enum.
- [La impresión varía entre navegadores] → Se valida en Chrome/Edge (los que usa la clínica); test e2e de Playwright que genera el PDF (`page.pdf()`) y comprueba páginas y textos clave.
- [`LIKE %term%` sin índice] → Aceptable al volumen esperado; si crece, `pg_trgm` en un change aparte.
- [Guardar al cambiar de paso no protege de cerrar el navegador a la mitad] → `beforeunload` avisa; autoguardado temporizado queda fuera (posible mejora).
- [Datos de salud (sensibles)] → Acceso por autor/ADMIN, `404` para lo ajeno, nada de datos clínicos en logs; cifrado en reposo y política de retención quedan para el despliegue.

## Migration Plan

- Flyway `V8__orthodontic_records.sql` crea la tabla e índices (sin datos previos que migrar).
- Flyway `V9__facial_presence_notes.sql` (contenido `schemaVersion` 2): tercios y simetrías faciales pasan a presenta / no presenta + texto; el detalle anterior (tercio aumentado/disminuido, tercios afectados, lados asimétricos) se conserva como texto en la nota. Solo toca filas en versión 1 (idempotente). Rollback: la tabla es nueva; revertir el despliegue y, si hiciera falta, `DROP TABLE orthodontic_records` manual (no hay migraciones de bajada en el proyecto).

## Open Questions

- ~~Número de historia~~ → resuelto: correlativo por autor `AEO-001` (D11).
- ~~"* Examen del corazón"~~ → resuelto: se mantiene como texto fijo.
- ~~Longitudes de documento~~ → confirmadas: CE 9 dígitos, Pasaporte 6–12 dígitos, solo números.
- ~~Revisión página por página~~ → completada para la fase 1 (`docs/pdf/revision-pag-01..05.html`, locales): D3 refleja lo acordado con el usuario.
- ~~Relaciones de caninos/molares~~ → resuelto: Clase I/II/III por lado + detalle en texto (fracciones).
