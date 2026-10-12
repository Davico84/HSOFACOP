## Context

- `V15__record_number_manual.sql` fijó el número manual con `CHECK (record_number ~ '^AOC-[0-9]{4}$')` e índice único `ux_orthodontic_records_record_number`. `search_text` guarda el número normalizado en minúsculas (`aoc-0018`).
- La anamnesis vive en `content` (JSONB, `schemaVersion` 8). `menarcheDate` es `LocalDate` en `Anamnesis`; lo validan `PatientFields` (no futura, no anterior al nacimiento) y Zod, y lo limpia `RecordNormalizer` (solo con sexo femenino y respuesta Sí).
- En producción hay historias reales con números `AOC-` y quizá fechas de menarquia.

## Goals / Non-Goals

**Goals:** prefijo AEO en todo el sistema, año de menarquia, y datos existentes convertidos sin intervención manual.

**Non-Goals:** aceptar AOC y AEO a la vez; cambiar reglas de unicidad o de corrección del número.

## Decisions

### Migración `V16` (una sola, transaccional)
1. Número: soltar el `CHECK` viejo, actualizar y poner el nuevo:
   ```sql
   ALTER TABLE orthodontic_records DROP CONSTRAINT ck_orthodontic_records_record_number;
   UPDATE orthodontic_records
   SET record_number = 'AEO-' || substring(record_number from 5),
       search_text   = replace(search_text, lower(record_number), lower('AEO-' || substring(record_number from 5)))
   WHERE record_number LIKE 'AOC-%';
   ALTER TABLE orthodontic_records ADD CONSTRAINT ck_orthodontic_records_record_number CHECK (record_number ~ '^AEO-[0-9]{4}$');
   ```
   Mismos dígitos ⇒ el índice único no puede chocar. No se toca `version` (no es una edición; un formulario abierto no queda desactualizado por esto, y al guardar enviaría el AOC viejo → 400 con el mensaje de formato; aceptable para un cambio de un día).
2. Menarquia: para cada historia con `content->'anamnesis'->>'menarcheDate'` no nulo, poner `menarcheYear` = primeros 4 caracteres como número y quitar `menarcheDate`; quitar también `menarcheDate` nulo. `schemaVersion` = `GREATEST(…, 9)`.
- Alternativa descartada: aceptar ambos prefijos. Dos formatos para lo mismo complican búsqueda y reportes.

### Número: dónde cambia
- Backend: `@Pattern(regexp = "AEO-[0-9]{4}", message = "Usa el formato AEO-0001.")` en create/update; ejemplos de `@Schema`; Javadoc de la entidad; mensaje de número repetido usa el número tal cual.
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
