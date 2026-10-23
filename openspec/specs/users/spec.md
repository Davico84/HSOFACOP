# users Specification

## Purpose
Gestiona las cuentas de usuario desde la administración: el estado de cada cuenta (`ACTIVE`/`DISABLED`), el listado paginado de cuentas y el cambio de estado de las cuentas `USER` por un `ADMIN`, con su pantalla "Usuarios" en la zona privada. Las consecuencias del estado sobre el inicio y la renovación de sesión viven en `authentication`.

## Requirements

### Requirement: Estado de la cuenta
El sistema SHALL mantener para cada cuenta un estado `ACTIVE` o `DISABLED`, independiente del bloqueo temporal por intentos fallidos. Las cuentas nuevas SHALL crearse `ACTIVE`.

#### Scenario: Cuenta nueva activa
- **WHEN** un visitante se registra
- **THEN** su cuenta se crea con estado `ACTIVE`

#### Scenario: Independiente del bloqueo por intentos
- **WHEN** una cuenta cambia de estado
- **THEN** su contador de intentos fallidos y su bloqueo temporal no cambian

#### Scenario: Correo de una cuenta deshabilitada
- **WHEN** alguien intenta registrarse con el correo de una cuenta `DISABLED`
- **THEN** el registro se rechaza como correo ya registrado

### Requirement: Listado de usuarios para administradores
El sistema SHALL permitir a un usuario `ADMIN` consultar las cuentas paginadas (20 por página por defecto, como máximo 100), con exactamente id, nombre, correo, rol, estado, cupo de historias clínicas (`recordQuota`, nulo = sin límite), cantidad de historias creadas (`recordCount`), turma del alumno (`cohort`), turmas de la coordinación (`coordinatorCohorts`) y celular, documento y COP (nulos si faltan) de cada una, y SHALL denegarlo a cualquier otro rol.

#### Scenario: Primera página
- **WHEN** un `ADMIN` consulta el listado de usuarios
- **THEN** recibe la primera página con hasta 20 cuentas, el número de página, el tamaño, el total de elementos y de páginas y si es la última

#### Scenario: Página siguiente
- **WHEN** un `ADMIN` pide la página siguiente
- **THEN** recibe las cuentas de esa página

#### Scenario: Tamaño de página por encima del máximo
- **WHEN** un `ADMIN` pide un tamaño de página mayor que 100
- **THEN** recibe como mucho 100 cuentas y la respuesta indica el tamaño aplicado (100)

#### Scenario: Página sin resultados
- **WHEN** un `ADMIN` pide una página posterior a la última
- **THEN** recibe una página vacía con los totales, sin error

#### Scenario: Solo los datos necesarios
- **WHEN** se devuelve una cuenta en el listado
- **THEN** contiene exactamente id, correo, nombre, rol, estado, cupo de historias, cantidad de historias creadas, turma del alumno, turmas de la coordinación, celular, documento y COP, y nunca el hash de la contraseña, el contador de intentos, el bloqueo temporal ni fechas internas

#### Scenario: Usuario sin rol de administrador
- **WHEN** un usuario `USER` o `COORDINATOR` consulta el listado de usuarios
- **THEN** la API responde `403`

### Requirement: Cambio de estado de cuentas USER
El sistema SHALL permitir a un `ADMIN` deshabilitar y reactivar cuentas con rol `USER` o `COORDINATOR`, SHALL rechazar el cambio de estado de cuentas `ADMIN`, SHALL revocar las sesiones renovables de una cuenta al deshabilitarla y SHALL NOT restaurarlas al reactivarla.

#### Scenario: Deshabilitar una cuenta USER
- **WHEN** un `ADMIN` deshabilita una cuenta `USER` activa
- **THEN** la cuenta queda `DISABLED`
- **AND** todos sus tokens de refresco quedan revocados, de modo que su sesión termina como tarde al caducar el token de acceso en curso

#### Scenario: Reactivar una cuenta USER
- **WHEN** un `ADMIN` reactiva una cuenta `USER` deshabilitada
- **THEN** la cuenta queda `ACTIVE` y puede volver a iniciar sesión
- **AND** sus tokens de refresco revocados siguen sin ser válidos

#### Scenario: Mismo estado
- **WHEN** un `ADMIN` envía para una cuenta `USER` el estado que ya tiene
- **THEN** la API responde `200` con la cuenta sin cambios

#### Scenario: Cuenta ADMIN
- **WHEN** un `ADMIN` intenta cambiar el estado de una cuenta `ADMIN` (incluida la suya), con cualquier estado
- **THEN** la API responde `409` y la cuenta no cambia

#### Scenario: Cuenta inexistente
- **WHEN** un `ADMIN` intenta cambiar el estado de una cuenta que no existe
- **THEN** la API responde `404`

#### Scenario: Estado inválido
- **WHEN** un `ADMIN` envía un estado ausente, nulo o distinto de `ACTIVE`/`DISABLED`
- **THEN** la API responde `400` y la cuenta no cambia

#### Scenario: Usuario sin rol de administrador
- **WHEN** un usuario `USER` o `COORDINATOR` intenta cambiar el estado de una cuenta
- **THEN** la API responde `403` y la cuenta no cambia

#### Scenario: Deshabilitar una cuenta de coordinación
- **WHEN** un `ADMIN` deshabilita una cuenta `COORDINATOR` activa
- **THEN** la cuenta queda `DISABLED` con sus tokens de refresco revocados y conserva sus turmas para cuando se reactive

### Requirement: Pantalla de usuarios para administradores
El sistema SHALL ofrecer a los `ADMIN` una sección "Usuarios" dentro del shell con el listado paginado, la turma de cada alumno y el rol ("Alumno", "Coordinación", "Administrador"); en cada cuenta `USER` o `COORDINATOR`, la acción para deshabilitarla o reactivarla tras una confirmación; las acciones de turma y de coordinación de la capacidad `cohorts`; y la gestión de turmas. La sección SHALL estar restringida a `ADMIN`.

#### Scenario: Listado en pantalla
- **WHEN** un `ADMIN` abre la sección "Usuarios"
- **THEN** ve una tabla con nombre, correo, rol y estado de cada cuenta de la página, y controles para cambiar de página ("Siguiente" deshabilitado en la última)

#### Scenario: Cambio de página
- **WHEN** un `ADMIN` cambia de página
- **THEN** la tabla anterior sigue visible mientras carga la nueva y los controles reflejan la página pedida

#### Scenario: Deshabilitar con confirmación
- **WHEN** un `ADMIN` pulsa "Deshabilitar" en una cuenta `USER` activa
- **THEN** se pide confirmación
- **AND** al confirmar, mientras la petición está en curso la acción no puede repetirse, y al terminar la cuenta aparece como deshabilitada con la acción "Activar"
- **AND** al cancelar, la cuenta no cambia y no se envía ninguna petición

#### Scenario: Error al cambiar el estado
- **WHEN** el cambio de estado falla (p. ej. `409` o `404`)
- **THEN** se muestra el mensaje del error y el listado se recarga con el estado real

#### Scenario: Página vacía
- **WHEN** la página actual queda sin cuentas (p. ej. tras recargar el listado) y no es la primera
- **THEN** la pantalla muestra un estado vacío con la opción de volver a la página anterior, sin error

#### Scenario: Cuentas ADMIN sin acción
- **WHEN** el listado incluye cuentas `ADMIN`
- **THEN** esas filas no ofrecen ninguna acción de estado

#### Scenario: Sección restringida
- **WHEN** un usuario `USER` o `COORDINATOR` abre el shell o navega a la ruta de "Usuarios"
- **THEN** la sección no aparece en su navegación y la ruta muestra el acceso denegado del shell

#### Scenario: Asignar la turma desde la lista
- **WHEN** el `ADMIN` elige "Turma 2" para un alumno en "Usuarios"
- **THEN** la fila del alumno muestra "Turma 2"

#### Scenario: Convertir en coordinación desde la lista
- **WHEN** el `ADMIN` convierte una cuenta en coordinación y marca "Turma 1"
- **THEN** la fila muestra el rol "Coordinación" y sus turmas, y ya no ofrece cupo ni turma de alumno

#### Scenario: Gestionar turmas
- **WHEN** el `ADMIN` crea la turma "Turma 3" desde "Usuarios"
- **THEN** la turma queda disponible para asignar a alumnos y a coordinaciones

### Requirement: Cupo de historias clínicas por usuario
Un `ADMIN` SHALL poder asignar, cambiar o quitar el cupo de historias clínicas de una cuenta `USER`: un entero entre 0 y 9999, o sin límite. El cupo SHALL poder quedar por debajo de las historias ya creadas, sin afectarlas. El sistema SHALL denegar el cambio a cualquier otro rol y rechazarlo para cuentas `ADMIN`. En "Usuarios", cada cuenta `USER` SHALL mostrar sus historias creadas y su cupo, con una acción para cambiarlo.

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

### Requirement: Cupo inicial de las cuentas nuevas
Toda cuenta nueva SHALL nacer con el cupo inicial configurado en el despliegue (`app.records.default-quota`), que por defecto es 1; si se configura vacío, nace sin límite. Las cuentas que ya existían SHALL conservar su cupo.

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

### Requirement: Datos de contacto e identificación de la cuenta
Cada cuenta SHALL poder guardar, todos opcionales: celular (9 dígitos que empiezan con 9), documento (tipo DNI, carné de extranjería o pasaporte y su número, con las mismas reglas que el documento del paciente, siempre los dos juntos) y número de colegiatura COP (1 a 6 dígitos). Un dato con formato inválido SHALL rechazarse con `400` sin guardar nada.

#### Scenario: Datos válidos
- **WHEN** se guardan el celular "987654321", el carné de extranjería "001234567" y el COP "12345"
- **THEN** la cuenta queda con esos datos

#### Scenario: Celular inválido
- **WHEN** se envía el celular "87654321" o "887654321"
- **THEN** el sistema responde `400` con el error en el celular y no guarda nada

#### Scenario: Documento incompleto
- **WHEN** se envía un tipo de documento sin número, o un número sin tipo
- **THEN** el sistema responde `400` con el error en el campo que falta

#### Scenario: Quitar un dato
- **WHEN** se guarda el celular vacío en una cuenta que lo tenía
- **THEN** la cuenta queda sin celular

### Requirement: Pantalla "Mis datos"
Toda cuenta autenticada SHALL tener en el menú la pantalla "Mis datos", donde ve su nombre, correo y rol (solo lectura) y edita su celular, documento y COP. Solo SHALL leer y cambiar los datos de su propia cuenta.

#### Scenario: Completar los datos después del registro
- **WHEN** un alumno que se registró sin celular lo agrega en "Mis datos" y guarda
- **THEN** se avisa "Datos guardados" y el `ADMIN` ve el celular en "Usuarios"

#### Scenario: Error junto al campo
- **WHEN** un alumno escribe un DNI de 7 dígitos en "Mis datos"
- **THEN** el formulario muestra el error junto al campo y no envía la petición

#### Scenario: Sin sesión
- **WHEN** una petición sin sesión pide o cambia "Mis datos"
- **THEN** el sistema responde `401`

### Requirement: Datos de la cuenta en Usuarios
En "Usuarios", el `ADMIN` SHALL ver los datos de contacto e identificación de cada cuenta con la acción "Ver datos", que muestra celular, documento y COP (o "Sin registrar" en los que falten). El `ADMIN` NO SHALL editarlos.

#### Scenario: Ver los datos de un alumno
- **WHEN** el `ADMIN` pulsa "Ver datos" en un alumno con celular y sin COP
- **THEN** ve el celular y "Sin registrar" en el COP, sin campos editables

### Requirement: Enlace de restablecimiento de contraseña
Un `ADMIN` SHALL poder generar para una cuenta `USER` o `COORDINATOR` activa un enlace de restablecimiento de un solo uso que vence a las 24 horas. Generar uno nuevo SHALL anular el anterior que no se haya usado. Para una cuenta `ADMIN` o deshabilitada SHALL responder `409`; a otro rol, `403`. El enlace solo se muestra al generarlo: el sistema NO SHALL guardarlo en claro.

#### Scenario: Generar un enlace
- **WHEN** un `ADMIN` genera el enlace de restablecimiento de un alumno activo
- **THEN** recibe un enlace que sirve una vez durante 24 horas

#### Scenario: Un enlace nuevo anula el anterior
- **WHEN** un `ADMIN` genera un segundo enlace para la misma cuenta
- **THEN** el primero ya no sirve para restablecer y el segundo sí

#### Scenario: Cuenta ADMIN o deshabilitada
- **WHEN** un `ADMIN` intenta generar el enlace de una cuenta `ADMIN` o de una cuenta deshabilitada
- **THEN** el sistema responde `409` y no genera nada

#### Scenario: Otro rol intenta generar un enlace
- **WHEN** un `USER` o un `COORDINATOR` intenta generar un enlace de restablecimiento
- **THEN** el sistema responde `403`

### Requirement: Restablecer la contraseña desde Usuarios
En "Usuarios", cada cuenta `USER` o `COORDINATOR` SHALL ofrecer la acción "Restablecer contraseña", que tras una confirmación genera el enlace y lo muestra en un diálogo con "Copiar enlace", la hora en que vence y la indicación de enviarlo a la persona. Al cerrarlo, el enlace NO SHALL volver a mostrarse.

#### Scenario: Copiar el enlace para enviarlo
- **WHEN** el `ADMIN` confirma "Restablecer contraseña" de un alumno y pulsa "Copiar enlace"
- **THEN** el enlace queda en el portapapeles, se avisa "Enlace copiado" y el diálogo muestra cuándo vence

#### Scenario: Cancelar no genera nada
- **WHEN** el `ADMIN` pulsa "Restablecer contraseña" y cancela la confirmación
- **THEN** no se genera ningún enlace y el anterior, si había, sigue vigente
