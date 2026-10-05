-- Capacidad: orthodontic-records — pasos del formulario con datos (para las métricas de Inicio).
-- Máscara de bits: bit n-1 = paso n con datos. Nulo = historia guardada antes de este cambio
-- ("sin calcular"): se calcula en su próximo guardado.

ALTER TABLE orthodontic_records ADD COLUMN filled_steps SMALLINT NULL;
ALTER TABLE orthodontic_records
    ADD CONSTRAINT ck_orthodontic_records_filled_steps CHECK (filled_steps IS NULL OR filled_steps BETWEEN 0 AND 255);
