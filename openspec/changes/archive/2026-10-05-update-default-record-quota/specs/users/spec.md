## MODIFIED Requirements

### Requirement: Cupo de historias clínicas por usuario
Un `ADMIN` SHALL poder asignar, cambiar o quitar el cupo de historias clínicas de una cuenta `USER`: un número entero entre 0 y 9999, o sin límite. Toda cuenta nueva SHALL nacer con el cupo inicial configurado en el despliegue (`app.records.default-quota`), que por defecto es 1; si se configura vacío, las cuentas nuevas nacen sin límite. Las cuentas que ya existían SHALL conservar su cupo. El cupo SHALL poder quedar por debajo de las historias ya creadas, sin afectarlas. El sistema SHALL denegar el cambio a cualquier otro rol y SHALL rechazarlo para cuentas `ADMIN`. En la pantalla "Usuarios", cada cuenta `USER` SHALL mostrar sus historias creadas y su cupo, con una acción para cambiarlo.

#### Scenario: Cuenta nueva con el cupo inicial
- **WHEN** un tratante se registra y el cupo inicial es el de por defecto
- **THEN** su cuenta nace con cupo 1 y la pantalla "Usuarios" muestra "0 de 1"

#### Scenario: Cupo inicial configurado
- **WHEN** el despliegue configura el cupo inicial en 3 y un tratante se registra
- **THEN** su cuenta nace con cupo 3

#### Scenario: Cupo inicial vacío
- **WHEN** el despliegue configura el cupo inicial vacío y un tratante se registra
- **THEN** su cuenta nace sin límite

#### Scenario: Cuentas existentes
- **WHEN** se despliega este cambio y había cuentas sin límite
- **THEN** siguen sin límite hasta que un `ADMIN` les asigne un cupo

#### Scenario: Asignar un cupo
- **WHEN** un `ADMIN` asigna un cupo de 5 a una cuenta `USER` con 3 historias creadas
- **THEN** la cuenta queda con cupo 5 y la pantalla "Usuarios" muestra "3 de 5"

#### Scenario: Quitar el límite
- **WHEN** un `ADMIN` marca "Sin límite" en el cupo de una cuenta `USER`
- **THEN** la cuenta queda sin cupo y la pantalla muestra "3 · sin límite"

#### Scenario: Cupo por debajo de lo ya creado
- **WHEN** un `ADMIN` asigna un cupo de 2 a una cuenta con 3 historias creadas
- **THEN** el diálogo avisa que el tratante ya tiene 3 historias y no podrá crear más; al confirmar, el cupo queda en 2 y las 3 historias siguen intactas

#### Scenario: Valor inválido
- **WHEN** se envía un cupo negativo, con decimales o mayor que 9999
- **THEN** la API responde `400` con el error en `recordQuota`

#### Scenario: Historias de una cuenta ADMIN
- **WHEN** un `ADMIN` ve en la pantalla "Usuarios" una cuenta `ADMIN` con 3 historias creadas
- **THEN** la columna de historias muestra "3 · no aplica" y no ofrece la acción de cupo

#### Scenario: Cuenta ADMIN
- **WHEN** un `ADMIN` intenta asignar un cupo a una cuenta `ADMIN`
- **THEN** la API responde `409` y no cambia nada

#### Scenario: Usuario sin rol de administrador
- **WHEN** un usuario `USER` intenta cambiar un cupo
- **THEN** la API responde `403`
