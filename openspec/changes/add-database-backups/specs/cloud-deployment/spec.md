## ADDED Requirements

### Requirement: Copia diaria cifrada de la base fuera del proveedor
El repositorio SHALL incluir un workflow programado que una vez al día (y a pedido) haga un volcado completo de la base de producción con una credencial de solo lectura, lo cifre con la clave pública configurada y lo guarde fuera del proveedor de la base como artifact con 90 días de retención. Ningún volcado sin cifrar ni dato de la base SHALL subirse ni aparecer en los logs. Si falta la configuración, el workflow SHALL omitir la copia sin fallar.

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

### Requirement: Restauración de la copia verificada
Cada copia SHALL restaurarse, antes de subirse, en una PostgreSQL de la misma versión mayor vacía, y el workflow SHALL fallar si la restauración no termina o si faltan la tabla de migraciones o las tablas de la aplicación. El repositorio SHALL documentar cómo descifrar una copia y restaurarla en una base nueva.

#### Scenario: Copia que se restaura
- **WHEN** el volcado se restaura en la base vacía del job
- **THEN** la tabla de migraciones registra la última migración del repositorio y existen las tablas de la aplicación
- **AND** recién entonces se sube el artifact

#### Scenario: Copia que no se restaura
- **WHEN** la restauración falla o falta alguna de esas tablas
- **THEN** el workflow falla y no sube el artifact

#### Scenario: Restauración documentada
- **WHEN** el responsable sigue la guía con un artifact y su clave privada
- **THEN** obtiene una base con los datos de la copia, sin tocar la de producción
