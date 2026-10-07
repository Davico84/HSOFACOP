## Why

La historia clínica necesita reflejar el flujo real de la clínica: el número de historia es asignado por los docentes y debe poder registrarse o corregirse por el odontólogo, en lugar de generarse automáticamente por el sistema. Además, la anamnesis requiere una escala clínica para higiene oral y un dato menstrual más completo para pacientes femeninas.

## What Changes

- Reemplazar el número `AEO-` autogenerado por un número de historia ingresado por el odontólogo en el paso 1 (anamnesis), con formato `AOC-0001`: prefijo `AOC-` más exactamente cuatro dígitos, incluyendo ceros a la izquierda.
- Permitir que el autor o un `ADMIN` corrijan el número de historia desde el paso 1, incluso después de imprimirla.
- Validar que el número de historia sea obligatorio y único entre todas las historias vigentes, de cualquier autor y cohorte (los docentes no reinician la numeración). Al corregirse, el número anterior queda libre. Un número ya usado responde `409` (`/errors/record-number-taken`) junto al campo, sin pausar el autoguardado.
- Cambiar "Higiene oral" de una respuesta Sí/No a una selección única: `Excelente`, `Buena`, `Regular` o `Deficiente`.
- Para pacientes de sexo femenino, mostrar "¿La 1ª menstruación ya ocurrió?" con respuesta Sí/No.
- Si la respuesta menstrual es Sí, habilitar el registro de la fecha de la primera menstruación; la fecha no podrá ser futura ni anterior a la fecha de nacimiento. Si es No, ocultar y limpiar la fecha.
- Ocultar y limpiar la respuesta y fecha menstrual cuando el sexo no sea femenino.
- En el paso 6, dentro de "Diagnóstico cefalométrico", ofrecer seis análisis: `Steiner`, `Ricketts`, `McNamara`, `Wits`, `Tweed` y `Jarabak`.
- Mantener el requisito de realizar como mínimo tres análisis cefalométricos, mostrando el progreso como `n de 3`, permitiendo seleccionar más de tres y permitiendo guardar menos de tres mientras la historia sea un borrador.
- Actualizar la persistencia, contrato API, formulario, vista previa/impresión y pruebas derivadas de los escenarios.

## Capabilities

### New Capabilities
<!-- Ninguna: el cambio modifica la capacidad existente. -->

### Modified Capabilities

- `orthodontic-records`: número de historia manual y editable; nuevos valores de higiene oral; primera menstruación con fecha condicionada al sexo y a la respuesta afirmativa; seis opciones de diagnóstico cefalométrico con mínimo de tres.

## Impact

- Backend: eliminar el correlativo técnico `recordSeq`, hacer manual el número visible y permitir su edición por el autor o un `ADMIN`; migración, validación de unicidad global y actualización de DTOs, servicios, persistencia y contrato OpenAPI.
- Frontend: paso 1, selector de higiene oral, campos condicionados de menstruación y mensajes de validación.
- Frontend: paso 6 con las seis opciones cefalométricas, contador `n de 3` y actualización de vista previa/impresión.
- Impresión/vista previa: mostrar el número manual, la categoría de higiene oral y la respuesta/fecha menstrual cuando corresponda.
- Datos existentes (de prueba): la migración asigna números provisionales `AOC-` + `id` con cuatro dígitos (únicos) y quita la Higiene oral Sí/No, que no se puede convertir a una categoría. Las historias de Neon también se pueden vaciar antes de desplegar.
- Zona horaria: el reloj de la app pasa a `America/Lima` (configurable). Hoy usa la del sistema, que en Render es UTC, y eso desplaza "hoy" desde las 19:00.
- Documentación: delta de `orthodontic-records` y actualización del estado en `docs/vision.md`.

## Non-goals

- No cambiar el formato visual general ni el orden de los ocho pasos.
- No permitir números duplicados ni reemplazar el identificador técnico interno de la historia.
- No agregar otros datos ginecológicos o de salud sexual.
- No hacer obligatorio completar todos los campos de la historia; se mantiene el comportamiento de borrador.

## Resolved Decisions

- El número asignado por docentes se tratará como texto con el patrón exacto `AOC-` seguido de cuatro dígitos (`AOC-0001`–`AOC-9999`).
- El número es único entre las historias vigentes y no se reinicia entre cohortes; al corregirse, el anterior queda libre (pudo ser un error que pertenece a otra historia).
- Pueden corregirlo el autor y el `ADMIN`.
- Los datos actuales son de prueba: se pueden descartar.
