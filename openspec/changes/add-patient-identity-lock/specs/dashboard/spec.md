## ADDED Requirements

### Requirement: Solicitudes de desbloqueo en Inicio del ADMIN
Inicio del `ADMIN` SHALL listar las solicitudes de desbloqueo pendientes, de la más antigua a la más nueva, hasta 10 más el total, con número de historia, paciente, tratante, fecha y motivo; cada una SHALL enlazar a la historia, donde el ADMIN desbloquea o descarta. Sin solicitudes SHALL indicar "No hay solicitudes de desbloqueo". La lista SHALL ser siempre un arreglo (vacío si no hay).

#### Scenario: Solicitudes pendientes
- **WHEN** hay 3 solicitudes de desbloqueo pendientes
- **THEN** Inicio del ADMIN las muestra de la más antigua a la más nueva, con su motivo y un enlace a cada historia

#### Scenario: Sin solicitudes
- **WHEN** no hay solicitudes pendientes
- **THEN** Inicio del ADMIN indica "No hay solicitudes de desbloqueo"

#### Scenario: Muchas solicitudes
- **WHEN** hay 14 solicitudes pendientes
- **THEN** se muestran las 10 más antiguas y el total "14 solicitudes"

#### Scenario: Solicitud resuelta
- **WHEN** el ADMIN desbloquea o descarta una solicitud y vuelve a Inicio
- **THEN** ya no aparece
