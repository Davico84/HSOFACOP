-- Capacidad: orthodontic-records — edad de la primera menstruación (contenido schemaVersion 10).
-- Lo que se sabe es la edad a la que ocurrió, no el año: el año guardado pasa a
-- edad = año − año de nacimiento. Sin fecha de nacimiento, o si el cálculo no da una edad
-- positiva, el dato queda vacío (la respuesta Sí/No se conserva). Una sola transacción, con el
-- preflight primero: con contenido inválido aborta con los ids sin tocar nada.

-- 1. Preflight: menarcheYear debe ser null o un entero (lo escribe solo la API desde V16).
DO $$
DECLARE
    bad bigint[];
BEGIN
    SELECT array_agg(id) INTO bad
    FROM orthodontic_records
    WHERE jsonb_typeof(content->'anamnesis') = 'object'
      AND content->'anamnesis' ? 'menarcheYear'
      AND jsonb_typeof(content->'anamnesis'->'menarcheYear') <> 'null'
      AND (jsonb_typeof(content->'anamnesis'->'menarcheYear') <> 'number'
           OR NOT (content->'anamnesis'->>'menarcheYear') ~ '^[0-9]+$');
    IF bad IS NOT NULL THEN
        RAISE EXCEPTION 'V17: menarcheYear inválido en historias %. Corríjalas y reintente.', bad;
    END IF;
END $$;

-- 2. Año -> edad, solo con fecha de nacimiento y resultado positivo.
UPDATE orthodontic_records
SET content = jsonb_set(content, '{anamnesis,menarcheAge}',
                        to_jsonb((content->'anamnesis'->>'menarcheYear')::int - extract(year FROM birth_date)::int))
WHERE jsonb_typeof(content->'anamnesis'->'menarcheYear') = 'number'
  AND birth_date IS NOT NULL
  AND (content->'anamnesis'->>'menarcheYear')::int - extract(year FROM birth_date)::int > 0;

-- 3. La clave vieja se quita siempre.
UPDATE orthodontic_records
SET content = content #- '{anamnesis,menarcheYear}'
WHERE jsonb_typeof(content->'anamnesis') = 'object' AND content->'anamnesis' ? 'menarcheYear';

-- 4. schemaVersion 10 (V16 dejó todos en entero).
UPDATE orthodontic_records
SET content = jsonb_set(content, '{schemaVersion}',
                        to_jsonb(GREATEST(COALESCE((content->>'schemaVersion')::int, 1), 10)));
