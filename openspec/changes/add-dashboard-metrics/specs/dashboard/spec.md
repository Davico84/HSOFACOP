## ADDED Requirements

### Requirement: Métricas del tratante en Inicio
Para un `USER`, Inicio SHALL mostrar métricas de sus propias historias, calculadas en el servidor (`GET /api/dashboard/me`): total de historias, creadas en el mes en curso, uso del cupo ("N de M" o "sin límite"), historias completas (8 de 8 pasos con datos), en progreso, sin calcular y el promedio de pasos con datos (sobre las calculadas), cuántas no tienen documento, fecha de nacimiento o fecha de inicio de tratamiento, y cuántas tienen vacío cada paso. Las métricas NO SHALL incluir historias de otros tratantes.

#### Scenario: Historias y cupo
- **WHEN** un tratante con cupo 5 tiene 3 historias, una creada este mes
- **THEN** Inicio muestra 3 historias, 1 creada este mes y "3 de 5" de cupo

#### Scenario: Sin límite de cupo
- **WHEN** un tratante sin cupo abre Inicio
- **THEN** el uso del cupo dice "sin límite"

#### Scenario: Completitud
- **WHEN** un tratante tiene una historia con los 8 pasos con datos, otra con 3 y otra guardada antes de este cambio
- **THEN** Inicio muestra 1 completa, 1 en progreso, 1 sin calcular y un promedio de 5,5 pasos con datos

#### Scenario: Datos faltantes
- **WHEN** dos de sus historias no tienen número de documento y una no tiene fecha de inicio de tratamiento
- **THEN** Inicio muestra "2 sin documento" y "1 sin fecha de inicio", y la lista de pasos vacíos ordenada de más a menos frecuente

#### Scenario: Solo sus historias
- **WHEN** otro tratante tiene 10 historias
- **THEN** no cuentan en las métricas de este tratante

#### Scenario: Sin historias todavía
- **WHEN** un tratante sin historias abre Inicio
- **THEN** ve las métricas en cero y una invitación a crear su primera historia

### Requirement: Historias para retomar
Inicio del `USER` SHALL listar sus historias incompletas (menos de 8 pasos con datos, o sin calcular) más recientes por última modificación, hasta 5, con número, paciente, pasos con datos y fecha; cada una SHALL enlazar a la historia en su último paso trabajado.

#### Scenario: Retomar una historia
- **WHEN** un tratante tiene una historia incompleta cuyo último paso trabajado es el 6
- **THEN** aparece en "Para retomar" y su enlace abre `/historias/<id>?paso=6`

#### Scenario: Todas completas
- **WHEN** todas sus historias tienen los 8 pasos con datos
- **THEN** "Para retomar" indica que no hay historias pendientes

### Requirement: Métricas globales del ADMIN en Inicio
Para un `ADMIN`, Inicio SHALL mostrar solo métricas globales, calculadas en el servidor (`GET /api/dashboard/admin`): cuentas totales, activas, deshabilitadas y nuevas en el mes en curso; historias totales, creadas en el mes, completas, incompletas y sin calcular; historias creadas por mes en los últimos 6 meses (incluido el actual, con cero en los meses sin historias); hasta 5 tratantes con más historias con su completitud promedio; y los tratantes con cupo lleno o al 80 % o más. Un `USER` que pida estas métricas SHALL recibir `403`.

#### Scenario: Usuarios
- **WHEN** hay 12 cuentas, 2 deshabilitadas y 3 creadas este mes
- **THEN** Inicio del ADMIN muestra 12 cuentas, 10 activas, 2 deshabilitadas y 3 nuevas

#### Scenario: Historias por mes
- **WHEN** se crearon 4 historias en mayo, ninguna en junio y 7 en octubre
- **THEN** las barras de los últimos 6 meses muestran 4, 0 y 7 en esos meses

#### Scenario: Tratantes con más historias
- **WHEN** hay 8 tratantes con historias
- **THEN** se muestran los 5 con más historias, de más a menos, con su completitud promedio

#### Scenario: Cupos cerca del tope
- **WHEN** un tratante usa 4 de 5 y otro 5 de 5
- **THEN** ambos aparecen en cupos, el segundo marcado como lleno; un tratante sin cupo nunca aparece

#### Scenario: USER pide las métricas globales
- **WHEN** un `USER` llama a `GET /api/dashboard/admin`
- **THEN** la API responde `403`

#### Scenario: El ADMIN no ve métricas de tratante
- **WHEN** un `ADMIN` abre Inicio
- **THEN** ve solo las métricas globales, sin "Para retomar" ni su cupo
