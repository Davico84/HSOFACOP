-- Capacidad: orthodontic-records — número de historia AEO-0001 y año de la primera menstruación
-- (contenido schemaVersion 9). Una sola transacción: si algo falla, no queda nada a medias.
-- El preflight va primero: con contenido inválido aborta con los ids sin tocar nada. Solo la API
-- escribe content (fechas ISO válidas y schemaVersion entero), así que no debería ocurrir.

-- 1. Preflight.
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

-- 2. Número: AOC-nnnn -> AEO-nnnn. Mismos dígitos: el índice único no puede chocar.
-- search_text guarda el número en minúsculas (aoc-0018): el reemplazo es exacto.
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
