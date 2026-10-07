-- Capacidad: orthodontic-records — número de historia manual (AOC-0001) y contenido schemaVersion 8.
-- El número deja de ser un correlativo por autor (record_seq) y pasa a ser el que asignan los
-- docentes: único entre todas las historias vigentes. Los datos existentes son de prueba: reciben
-- un número provisional AOC- + id (único) que el autor o un ADMIN corrigen.
-- Higiene oral pasa de Sí/No a categorías: el valor viejo no permite deducir una, así que se quita.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM orthodontic_records WHERE id > 9999) THEN
        RAISE EXCEPTION 'Hay historias con id mayor que 9999: no caben en el formato AOC-0000. Asígneles números manualmente antes de migrar.';
    END IF;
END $$;

-- Número provisional y búsqueda en el mismo UPDATE (a la derecha se leen los valores anteriores).
-- search_text guarda el número normalizado en minúsculas (aeo-001), sin tildes: el reemplazo es exacto.
UPDATE orthodontic_records
SET record_number = 'AOC-' || lpad(id::text, 4, '0'),
    search_text = replace(search_text, lower(record_number), lower('AOC-' || lpad(id::text, 4, '0')));

ALTER TABLE orthodontic_records DROP CONSTRAINT ux_orthodontic_records_author_seq;
ALTER TABLE orthodontic_records DROP COLUMN record_seq;

ALTER TABLE orthodontic_records
    ADD CONSTRAINT ck_orthodontic_records_record_number CHECK (record_number ~ '^AOC-[0-9]{4}$');
CREATE UNIQUE INDEX ux_orthodontic_records_record_number ON orthodontic_records (record_number);

UPDATE orthodontic_records
SET content = content #- '{anamnesis,oralHygiene}'
WHERE content->'anamnesis'->>'oralHygiene' IN ('YES', 'NO');

UPDATE orthodontic_records
SET content = content
    || jsonb_build_object('schemaVersion', GREATEST(COALESCE((content->>'schemaVersion')::int, 1), 8));
