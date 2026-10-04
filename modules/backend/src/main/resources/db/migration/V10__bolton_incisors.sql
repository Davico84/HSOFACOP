-- Capacidad: orthodontic-records — contenido schemaVersion 7.
-- Bolton deja de compartir los incisivos con Nance: pasan a ser propios de Bolton
-- (models.bolton.incisors). Para no perder lo que la grilla de Bolton mostraba, se copian los
-- incisivos que la historia tenga en Nance, en toda historia (con o sin Bolton guardado).
-- Idempotente: solo copia un incisivo si Bolton aún no lo tiene y el de Nance es un número.

CREATE OR REPLACE FUNCTION pg_temp.incisors_to_copy(content jsonb) RETURNS jsonb
LANGUAGE sql IMMUTABLE AS $$
    SELECT COALESCE(jsonb_object_agg(src.k, src.v), '{}'::jsonb)
    FROM (
        SELECT k, content->'models'->'nance'->'upperWidths'->k AS v
        FROM unnest(ARRAY['tooth12', 'tooth11', 'tooth21', 'tooth22']) AS k
        UNION ALL
        SELECT k, content->'models'->'nance'->'lowerWidths'->k
        FROM unnest(ARRAY['tooth42', 'tooth41', 'tooth31', 'tooth32']) AS k
    ) AS src
    WHERE jsonb_typeof(src.v) = 'number'
      AND jsonb_typeof(content->'models'->'bolton'->'incisors'->src.k) IS DISTINCT FROM 'number'
$$;

UPDATE orthodontic_records
SET content = jsonb_set(
        jsonb_set(content, '{models,bolton}', COALESCE(content->'models'->'bolton', '{}'::jsonb), true),
        '{models,bolton,incisors}',
        COALESCE(content->'models'->'bolton'->'incisors', '{}'::jsonb) || pg_temp.incisors_to_copy(content),
        true)
    || jsonb_build_object('schemaVersion', GREATEST(COALESCE((content->>'schemaVersion')::int, 1), 7))
WHERE jsonb_typeof(content->'models'->'nance') = 'object'
  AND pg_temp.incisors_to_copy(content) <> '{}'::jsonb;
