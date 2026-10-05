-- Capacidad: orthodontic-records — retomar la historia en el último paso trabajado.
-- Nulo = historia guardada antes de este cambio (o recién creada): se abre en el paso 1.

ALTER TABLE orthodontic_records ADD COLUMN last_step INTEGER NULL;
ALTER TABLE orthodontic_records
    ADD CONSTRAINT ck_orthodontic_records_last_step CHECK (last_step IS NULL OR last_step BETWEEN 1 AND 8);
