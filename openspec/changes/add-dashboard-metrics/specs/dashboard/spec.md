## ADDED Requirements

### Requirement: Métricas del tratante en Inicio
Para un `USER`, Inicio SHALL mostrar métricas de sus propias historias, calculadas en el servidor (`GET /api/dashboard/me`): total de historias, creadas en el mes en curso (según la zona horaria de la app), uso del cupo ("N de M" o "sin límite"), historias completas, en progreso y sin calcular, el promedio de pasos clínicos con datos (sobre las calculadas, con un decimal; vacío si no hay calculadas), cuántas no tienen documento, fecha de nacimiento o fecha de inicio de tratamiento, y, para cada paso clínico (1–7), cuántas historias calculadas lo tienen vacío. Una historia es **completa** si tiene datos en los 7 pasos clínicos (1–7); el paso 8 (Firmas) no cuenta, porque se completa a mano sobre el papel. Los pasos vacíos SHALL listarse siempre los 7, ordenados de más a menos frecuente y, a igual frecuencia, por número de paso. Las métricas NO SHALL incluir historias de otros tratantes.

#### Scenario: Historias y cupo
- **WHEN** un tratante con cupo 5 tiene 3 historias, una creada este mes
- **THEN** Inicio muestra 3 historias, 1 creada este mes y "3 de 5" de cupo

#### Scenario: Sin límite de cupo
- **WHEN** un tratante sin cupo abre Inicio
- **THEN** el uso del cupo dice "sin límite"

#### Scenario: Completitud
- **WHEN** un tratante tiene una historia con datos en los pasos 1–7 (Firmas vacío), otra con 4 pasos y otra guardada antes de este cambio
- **THEN** Inicio muestra 1 completa, 1 en progreso, 1 sin calcular y un promedio de 5,5 pasos clínicos con datos

#### Scenario: Firmas no cuenta
- **WHEN** una historia tiene datos solo en los pasos 1–6 y en Firmas
- **THEN** figura en progreso y Firmas no aparece en la lista de pasos vacíos

#### Scenario: Promedio sin historias calculadas
- **WHEN** todas las historias del tratante están sin calcular
- **THEN** el promedio se muestra vacío ("—") y no como cero

#### Scenario: Datos faltantes
- **WHEN** dos de sus historias no tienen número de documento y una no tiene fecha de inicio de tratamiento
- **THEN** Inicio muestra "2 sin documento" y "1 sin fecha de inicio", y los 7 pasos clínicos ordenados de más a menos historias vacías (a igual cantidad, por número de paso)

#### Scenario: Solo sus historias
- **WHEN** otro tratante tiene 10 historias
- **THEN** no cuentan en las métricas de este tratante

#### Scenario: Sin historias todavía
- **WHEN** un tratante sin historias abre Inicio
- **THEN** ve las métricas en cero y una invitación a crear su primera historia

### Requirement: Historias para retomar
Inicio del `USER` SHALL listar sus historias no completas (en progreso o sin calcular) más recientes por última modificación, hasta 5, con número, paciente, pasos clínicos con datos (o "sin calcular") y fecha; cada una SHALL enlazar a la historia en su último paso trabajado, o en el paso 1 si no tiene.

#### Scenario: Retomar una historia
- **WHEN** un tratante tiene una historia incompleta cuyo último paso trabajado es el 6
- **THEN** aparece en "Para retomar" y su enlace abre `/historias/<id>?paso=6`

#### Scenario: Retomar sin último paso
- **WHEN** una historia para retomar no tiene último paso trabajado
- **THEN** su enlace abre `/historias/<id>?paso=1`

#### Scenario: Todas completas
- **WHEN** todas sus historias tienen los 7 pasos clínicos con datos
- **THEN** "Para retomar" indica que no hay historias pendientes

### Requirement: Métricas globales del ADMIN en Inicio
Para un `ADMIN`, Inicio SHALL mostrar solo métricas globales, calculadas en el servidor (`GET /api/dashboard/admin`): cuentas totales, activas, deshabilitadas y nuevas en el mes en curso; historias totales, creadas en el mes, completas, en progreso y sin calcular (mismo criterio de completa que el tratante); historias creadas por mes en los últimos 6 meses (incluido el actual, meses según la zona horaria de la app, con cero en los meses sin historias); hasta 5 tratantes con más historias (desempate por nombre) con su promedio de pasos clínicos con datos; y las cuentas `USER` con cupo lleno o al 80 % o más, las 10 más cerca del tope (las llenas primero) más el total que cumple la condición. Un `USER` que pida estas métricas SHALL recibir `403`.

#### Scenario: Usuarios
- **WHEN** hay 12 cuentas, 2 deshabilitadas y 3 creadas este mes
- **THEN** Inicio del ADMIN muestra 12 cuentas, 10 activas, 2 deshabilitadas y 3 nuevas

#### Scenario: Historias por mes
- **WHEN** se crearon 4 historias en mayo, ninguna en junio y 7 en octubre
- **THEN** las barras de los últimos 6 meses muestran 4, 0 y 7 en esos meses, rotuladas "may", "jun" y "oct"

#### Scenario: Corte de mes por zona horaria
- **WHEN** una historia se crea el 31 de mayo a las 21:00 hora de la clínica (1 de junio en UTC)
- **THEN** cuenta en mayo

#### Scenario: Tratantes con más historias
- **WHEN** hay 8 tratantes con historias
- **THEN** se muestran los 5 con más historias, de más a menos, con su completitud promedio

#### Scenario: Cupos cerca del tope
- **WHEN** un tratante usa 4 de 5 y otro 5 de 5
- **THEN** ambos aparecen en cupos, el lleno primero; un tratante sin cupo nunca aparece y uno con cupo 0 figura como lleno

#### Scenario: Muchos cupos cerca del tope
- **WHEN** 14 tratantes están al 80 % o más de su cupo
- **THEN** se muestran los 10 más cerca del tope y el total "14 tratantes"

#### Scenario: USER pide las métricas globales
- **WHEN** un `USER` llama a `GET /api/dashboard/admin`
- **THEN** la API responde `403`

#### Scenario: El ADMIN no ve métricas de tratante
- **WHEN** un `ADMIN` abre Inicio
- **THEN** ve solo las métricas globales, sin "Para retomar" ni su cupo
