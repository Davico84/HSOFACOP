## ADDED Requirements

### Requirement: Copia diaria cifrada de la base fuera del proveedor
El repositorio SHALL incluir un workflow programado que una vez al día, mientras el workflow programado esté habilitado en GitHub (y a pedido), haga un volcado completo de la base de producción con una credencial de solo lectura, lo cifre con la clave pública configurada y lo guarde fuera del proveedor de la base como artifact con 90 días de retención. Ningún volcado sin cifrar ni dato de la base SHALL subirse ni aparecer en los logs. El volcado sin cifrar SHALL borrarse del runner al terminar el job, también cuando falla. Si falta la configuración, el workflow SHALL omitir la copia sin fallar.

#### Scenario: Copia diaria
- **WHEN** se cumple la hora programada y el secreto de conexión y la clave pública están configurados
- **THEN** el workflow guarda un artifact con el volcado cifrado y la fecha en el nombre, retenido 90 días

#### Scenario: Copia a pedido
- **WHEN** el responsable ejecuta el workflow manualmente
- **THEN** se genera una copia igual que la programada

#### Scenario: Nada legible sin la clave privada
- **WHEN** alguien descarga el artifact de la copia sin la clave privada
- **THEN** solo obtiene un archivo cifrado con `age`
- **AND** los logs del workflow no muestran la cadena de conexión ni datos de la base

#### Scenario: Credencial de solo lectura
- **WHEN** se usa la credencial de la copia para modificar la base
- **THEN** la base la rechaza

#### Scenario: Proyecto sin configurar
- **WHEN** el workflow corre en un repositorio sin el secreto de conexión o sin la clave pública
- **THEN** omite la copia, lo indica en el resumen del job y termina sin error

#### Scenario: Falla de la copia
- **WHEN** la base no responde o el volcado falla
- **THEN** el workflow falla y no sube ningún artifact
- **AND** el volcado sin cifrar, si llegó a escribirse, se borra del runner

#### Scenario: Workflow programado desactivado
- **WHEN** GitHub desactiva el workflow programado tras 60 días sin actividad en el repositorio
- **THEN** no hay copias nuevas hasta reactivarlo
- **AND** la guía indica cómo detectarlo (correo de GitHub y fecha del último artifact) y reactivarlo desde la pestaña Actions o con `gh workflow enable`

### Requirement: Restauración de la copia verificada
Cada copia SHALL restaurarse, antes de subirse, en una PostgreSQL de la misma versión mayor vacía, y el workflow SHALL fallar si la restauración no termina, si la mayor versión aplicada con éxito en la tabla de migraciones (comparada como número) no es la de la última migración versionada del repositorio, o si alguna tabla incluida en la copia no quedó en la base restaurada. Si no puede determinar lo esperado (sin migraciones en el repositorio, sin tabla de migraciones o sin tablas en la copia), el workflow SHALL fallar en lugar de dar la copia por buena. El repositorio SHALL documentar cómo descifrar una copia y restaurarla en una base nueva.

#### Scenario: Copia que se restaura
- **WHEN** el volcado se restaura en la base vacía del job
- **THEN** la mayor versión aplicada con éxito en la tabla de migraciones es la de la última migración del repositorio en orden numérico (p. ej. `V15` y no `V9`)
- **AND** cada tabla incluida en la copia existe en la base restaurada
- **AND** recién entonces se sube el artifact

#### Scenario: Copia que no se restaura
- **WHEN** la restauración falla, la base de la copia está atrasada respecto de las migraciones del repositorio o falta alguna de esas tablas
- **THEN** el workflow falla y no sube el artifact

#### Scenario: Sin referencia para verificar
- **WHEN** el directorio de migraciones no existe o no tiene migraciones versionadas, la copia no tiene tabla de migraciones o no incluye ninguna tabla
- **THEN** el workflow falla y no sube el artifact

#### Scenario: Restauración documentada
- **WHEN** el responsable sigue la guía con un artifact y su clave privada
- **THEN** obtiene una base con los datos de la copia, sin tocar la de producción
