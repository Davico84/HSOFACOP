## Context

- `V15__record_number_manual.sql` fijó el número manual con `CHECK (record_number ~ '^AOC-[0-9]{4}$')` e índice único `ux_orthodontic_records_record_number`. `search_text` guarda el número normalizado en minúsculas (`aoc-0018`).
- La anamnesis vive en `content` (JSONB, `schemaVersion` 8). `menarcheDate` es `LocalDate` en `Anamnesis`; lo validan `PatientFields` (no futura, no anterior al nacimiento) y Zod, y lo limpia `RecordNormalizer` (solo con sexo femenino y respuesta Sí).
- En producción hay historias reales con números `AOC-` y quizá fechas de menarquia.

## Goals / Non-Goals

**Goals:** prefijo AEO en todo el sistema, año de menarquia, y datos existentes convertidos sin intervención manual.

**Non-Goals:** aceptar AOC y AEO a la vez; cambiar reglas de unicidad o de corrección del número.

## Decisions

### Migración `V16` (una sola, transaccional)
V16 corre en **una transacción** (Flyway con PostgreSQL, sin `executeInTransaction=false` ni sentencias que la impidan): si algo falla, no queda nada a medias. Además el **preflight va primero**, antes de cualquier `ALTER` o `UPDATE`, así que un dato inválido aborta sin haber tocado nada. Política ante datos inválidos: **abortar** con los ids, nunca adivinar ni perder datos en silencio. Solo la API escribe `content` (fechas ISO válidas y `schemaVersion` entero), así que no debería ocurrir; si ocurre, se corrige a mano y se reintenta el despliegue.

Definiciones exactas:
- `menarcheDate` **válida**: ausente, JSON `null`, o JSON string `^[0-9]{4}-[0-9]{2}-[0-9]{2}$` que PostgreSQL convierte a `date` (rechaza `2023-99-99` o `2023-02-30`).
- `schemaVersion` **válido**: ausente, o JSON number cuya representación textual sea `^[0-9]+$` (rechaza `8.0`, `"8"`, negativos y no números), compatible con el `::int` posterior.

```sql
-- 1. Preflight: nada se toca si hay contenido inválido.
DO $$
DECLARE
    r record;
    bad_dates bigint[] := '{}';
    bad_versions bigint[];
BEGIN
    FOR r IN
        SELECT id, content->'anamnesis'->'menarcheDate' AS v
        FROM orthodontic_records
        WHERE jsonb_typeof(content->'anamnesis') = 'object'
          AND content->'anamnesis' ? 'menarcheDate'
          AND jsonb_typeof(content->'anamnesis'->'menarcheDate') <> 'null'
    LOOP
        IF jsonb_typeof(r.v) <> 'string' OR NOT (r.v #>> '{}') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
            bad_dates := bad_dates || r.id;
        ELSE
            BEGIN
                PERFORM (r.v #>> '{}')::date;
            EXCEPTION WHEN others THEN
                bad_dates := bad_dates || r.id;
            END;
        END IF;
    END LOOP;

    SELECT array_agg(id) INTO bad_versions
    FROM orthodontic_records
    WHERE content ? 'schemaVersion'
      AND (jsonb_typeof(content->'schemaVersion') <> 'number'
           OR NOT (content->>'schemaVersion') ~ '^[0-9]+$');

    IF cardinality(bad_dates) > 0 OR bad_versions IS NOT NULL THEN
        RAISE EXCEPTION 'V16: contenido inválido. menarcheDate en historias %; schemaVersion en historias %. Corríjalas y reintente.',
            bad_dates, coalesce(bad_versions, '{}');
    END IF;
END $$;

-- 2. Número: AOC-nnnn -> AEO-nnnn (mismos dígitos: el índice único no puede chocar).
ALTER TABLE orthodontic_records DROP CONSTRAINT ck_orthodontic_records_record_number;
UPDATE orthodontic_records
SET record_number = 'AEO-' || substring(record_number from 5),
    search_text   = replace(search_text, lower(record_number), lower('AEO-' || substring(record_number from 5)))
WHERE record_number LIKE 'AOC-%';
ALTER TABLE orthodontic_records
    ADD CONSTRAINT ck_orthodontic_records_record_number CHECK (record_number ~ '^AEO-[0-9]{4}$');

-- 3. Menarquia: fecha válida -> año; la clave vieja se quita siempre (también null).
UPDATE orthodontic_records
SET content = jsonb_set(content, '{anamnesis,menarcheYear}',
                        to_jsonb(extract(year FROM (content->'anamnesis'->>'menarcheDate')::date)::int))
WHERE jsonb_typeof(content->'anamnesis'->'menarcheDate') = 'string';
UPDATE orthodontic_records
SET content = content #- '{anamnesis,menarcheDate}'
WHERE jsonb_typeof(content->'anamnesis') = 'object' AND content->'anamnesis' ? 'menarcheDate';

-- 4. schemaVersion 9 (el preflight garantiza entero o ausente).
UPDATE orthodontic_records
SET content = jsonb_set(content, '{schemaVersion}',
                        to_jsonb(GREATEST(COALESCE((content->>'schemaVersion')::int, 1), 9)));
```

- `search_text` guarda el número en minúsculas (`aoc-0018`), igual que lo dejó V15: el `replace` es exacto. No se toca `version` (no es una edición del usuario).
- Historias sin `anamnesis` o sin la clave: el preflight y los `UPDATE` las saltan (`jsonb_typeof(...)` es `NULL` o la clave no existe).
- **Código**: `RecordContent.CURRENT_SCHEMA_VERSION = 9`. Sin esto, el primer guardado tras la migración volvería a escribir 8 (lo escribe `RecordNormalizer`).
- **Tests** (`RecordNumberMigrationIT` o uno propio de V16, aplicando V16 sobre datos sembrados en V15): número y búsqueda; menarquia ausente, `null`, ISO válida (→ año), formato inválido y fecha imposible (`2023-02-30`) → V16 aborta y no cambia nada; `schemaVersion` ausente, `8` y `"8"`/`8.0` → aborta.
- Alternativa descartada: aceptar ambos prefijos. Dos formatos para lo mismo complican búsqueda y reportes.

### Número: dónde cambia
- Backend: `@Pattern(regexp = "AEO-[0-9]{4}", message = "Usa el formato AEO-0001.")` en create/update; **todos** los ejemplos `@Schema(example = "AOC-0015")`: `CreateRecordRequest`, `UpdateRecordRequest`, `RecordResponse`, `RecordSummaryResponse`, `UserDashboardResponse` y `AdminDashboardResponse` (si no, el contrato regenerado conserva AOC); Javadoc de la entidad; el mensaje de número repetido usa el número tal cual. Control: tras regenerar, `contracts/openapi.json` y el código de orval no contienen "AOC".
- Frontend: Zod (`record.ts`) con el mismo patrón y mensaje; placeholder "AEO-0001" en `Step1Patient`; ejemplos en tests y fixtures.
- Tests: `TestRecordNumbers` (backend) y `e2e/support/recordNumber.ts` generan `AEO-`. `RecordNumberMigrationIT` cubre V16 (AOC → AEO y búsqueda).

### Año de la primera menstruación
- Contrato: `Anamnesis.menarcheYear: Integer` (nullable), reemplaza a `menarcheDate`. **BREAKING** para el contrato; único cliente: el frontend (orval).
- Validación (backend `PatientFields`, misma forma en Zod): entre 1000 y 9999 (cuatro cifras); no mayor que el año actual del reloj de la app (`America/Lima`); si hay fecha de nacimiento, no menor que su año. Mensajes:
  - "El año de la primera menstruación no puede ser futuro."
  - "El año de la primera menstruación no puede ser anterior al de nacimiento."
  - "Usa un año de cuatro cifras."
- `RecordNormalizer`: igual que hoy, con el año (se descarta si el sexo no es femenino o la respuesta no es Sí).
- Formulario: `NumberInput` de `core/ui` (enteros, sin decimales) con etiqueta "Año de la 1ª menstruación".
- Impresión: `PrintField` "Año:" con el número.
- Alternativa descartada: string `"YYYY"`. Un entero valida y compara sin parseo.

## Risks / Trade-offs

- **Despliegue**: Render aplica V16 al arrancar; frontend (Vercel) y backend se publican casi a la vez. En la ventana entre ambos, el frontend viejo enviaría `menarcheDate`/`AOC-` y recibiría 400. Se despliega fuera de horario o se acepta el minuto de diferencia.
- **Formulario abierto durante el despliegue**: con número AOC en memoria, el guardado da 400 ("Usa el formato AEO-0001"); recargar trae el AEO. Lo mismo con una fecha de menarquia.
- **Fechas de menarquia mal cargadas** (año inválido tras la migración, p. ej. anterior al nacimiento): la migración no valida; al guardar esa historia el formulario lo señalará para corregir.
