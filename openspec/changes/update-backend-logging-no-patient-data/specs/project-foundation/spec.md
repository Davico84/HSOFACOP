# Spec Delta

## ADDED Requirements

### Requirement: Registros del backend sin datos de pacientes
Los registros del backend SHALL contener solo metadatos técnicos (marca de tiempo, nivel, `traceId`, clase de las excepciones e identificador numérico de cuenta). NO SHALL contener cuerpos de petición, valores de campos de historias ni el mensaje de una excepción que pueda incluir valores.

#### Scenario: Error no controlado
- **WHEN** una petición produce una excepción no controlada, p. ej. una violación de unicidad de la base de datos con el documento de un paciente
- **THEN** el registro lleva el `traceId`, la clase de la excepción y la de su causa raíz, y no incluye su mensaje ni el valor que causó el error
- **AND** la respuesta al cliente conserva su formato y su `traceId`

#### Scenario: Petición con datos en el cuerpo
- **WHEN** el tratante guarda una historia con contenido clínico
- **THEN** ningún registro contiene el cuerpo de la petición ni valores de la historia

#### Scenario: Sentencias SQL
- **WHEN** la aplicación se ejecuta con la configuración por defecto
- **THEN** el registro de sentencias SQL y de valores enlazados de Hibernate está en `WARN` o más estricto

#### Scenario: Causa raíz con datos
- **WHEN** la excepción tiene una causa cuyo mensaje contiene un valor de paciente
- **THEN** el registro nombra la clase de la causa y omite su mensaje
