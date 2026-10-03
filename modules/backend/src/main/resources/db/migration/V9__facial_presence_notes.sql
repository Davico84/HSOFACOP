-- Capacidad: orthodontic-records — contenido schemaVersion 2.
-- Análisis facial: proporción de tercios y simetrías (reposo y apertura) pasan a
-- presenta / no presenta + texto libre. El detalle que se elimina (tercio aumentado/disminuido,
-- tercios afectados, lados asimétricos) se conserva como texto en la nota nueva.

CREATE OR REPLACE FUNCTION pg_temp.option_labels(arr jsonb, kind text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
    SELECT string_agg(
        CASE kind
            WHEN 'third' THEN CASE v WHEN 'UPPER' THEN 'superior' WHEN 'MIDDLE' THEN 'medio' WHEN 'LOWER' THEN 'inferior' END
            ELSE CASE v WHEN 'RIGHT' THEN 'derecho' WHEN 'LEFT' THEN 'izquierdo' END
        END, ', ')
    FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(arr) = 'array' THEN arr ELSE '[]'::jsonb END) AS v
$$;

CREATE OR REPLACE FUNCTION pg_temp.nonblank(t text) RETURNS jsonb
LANGUAGE sql IMMUTABLE AS $$
    SELECT CASE WHEN t IS NULL OR btrim(t) = '' THEN 'null'::jsonb ELSE to_jsonb(t) END
$$;

UPDATE orthodontic_records
SET content = jsonb_set(
        content,
        '{facial}',
        (((content->'facial') - 'facialThirdsAffected') - 'restAsymmetrySides' - 'openingAsymmetrySides')
        || jsonb_build_object(
            'facialThirds',
                CASE WHEN content->'facial'->>'facialThirds' LIKE 'ABSENT%' THEN to_jsonb('ABSENT'::text)
                     ELSE COALESCE(content->'facial'->'facialThirds', 'null'::jsonb) END,
            'facialThirdsNotes', pg_temp.nonblank(concat_ws(': ',
                CASE content->'facial'->>'facialThirds'
                    WHEN 'ABSENT_INCREASED' THEN 'Tercio aumentado'
                    WHEN 'ABSENT_DECREASED' THEN 'Tercio disminuido' END,
                pg_temp.option_labels(content->'facial'->'facialThirdsAffected', 'third'))),
            'restSymmetryNotes', pg_temp.nonblank(
                'Lado asimétrico: ' || pg_temp.option_labels(content->'facial'->'restAsymmetrySides', 'side')),
            'openingSymmetryNotes', pg_temp.nonblank(
                'Lado asimétrico: ' || pg_temp.option_labels(content->'facial'->'openingAsymmetrySides', 'side'))
        ))
        || jsonb_build_object('schemaVersion', 2)
WHERE jsonb_typeof(content->'facial') = 'object'
  AND COALESCE((content->>'schemaVersion')::int, 1) < 2;
