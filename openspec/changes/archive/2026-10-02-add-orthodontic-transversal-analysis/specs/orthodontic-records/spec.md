## MODIFIED Requirements

### Requirement: Formulario por pasos con guardado de borrador
El sistema SHALL presentar la historia como un formulario de 8 pasos en el orden del PDF (Paciente y anamnesis · Análisis facial · Análisis funcional · Análisis oclusal y extra · Análisis de modelos · Análisis radiográfico · Diagnóstico y planes · Firmas). Salvo el nombre del paciente, ningún campo SHALL ser obligatorio: la historia es un borrador que se completa en varias sesiones. Al pasar a otro paso, si hay cambios, el sistema SHALL guardarlos antes de cambiar; si el guardado falla, SHALL quedarse en el paso actual mostrando el error.

#### Scenario: Avanzar guarda los cambios
- **WHEN** el usuario edita campos del paso 2 y pulsa "Siguiente"
- **THEN** el sistema guarda la historia y muestra el paso 3
- **AND** al reabrir la historia más tarde, los valores del paso 2 siguen ahí

#### Scenario: Saltar a un paso desde el indicador
- **WHEN** el usuario pulsa el paso 7 en el indicador de pasos estando en el paso 1 con cambios
- **THEN** el sistema guarda y abre el paso 7 (los pasos intermedios pueden quedar vacíos)

#### Scenario: Sin cambios no se guarda
- **WHEN** el usuario cambia de paso sin haber modificado nada
- **THEN** el sistema cambia de paso sin enviar ninguna petición de guardado

#### Scenario: Error de validación al guardar
- **WHEN** un campo supera su longitud máxima o un número está fuera de rango y el usuario intenta cambiar de paso
- **THEN** el sistema no cambia de paso y muestra el error junto al campo

#### Scenario: Fallo de red al guardar
- **WHEN** el guardado falla por un error del servidor o de red
- **THEN** el sistema se queda en el paso actual, conserva lo escrito y muestra un aviso con opción de reintentar

#### Scenario: Salir con cambios sin guardar
- **WHEN** el usuario intenta salir de la historia (otra sección, cerrar o recargar la pestaña) con cambios sin guardar
- **THEN** el sistema pide confirmación antes de abandonar y, si confirma, descarta los cambios

#### Scenario: Análisis de modelos después del análisis oclusal
- **WHEN** el usuario termina el análisis oclusal (paso 4) y pulsa "Siguiente"
- **THEN** se abre el paso 5 "Análisis de modelos", y el análisis radiográfico pasa a ser el paso 6

## ADDED Requirements

### Requirement: Análisis transversal de los modelos
El sistema SHALL registrar el análisis transversal de los modelos de la pág. 5 del PDF: AIS, AII, AMS y AMI; ancho del borde WALA, ancho X Pc, ancho X´ Pc y ancho X ideal; distancias WALA–EV de canino, 1er y 2do premolar, 1er y 2do molar inferiores; e interpretación. Las medidas SHALL estar en milímetros, entre 0 y 99,9, con a lo sumo un decimal. Paciente, edad y sexo SHALL tomarse de la historia. El sistema SHALL calcular, en pantalla y en la impresión, la diferencia del AMS y del AMI con el promedio intermolar según el sexo del paciente (maxilar: 54,0 mm hombres / 52,4 mm mujeres; mandibular: 47,2 / 46,1 mm) y la diferencia de cada distancia WALA–EV con su norma (canino 0,6; 1er premolar 0,8; 2do premolar 1,3; 1er molar 2,0; 2do molar 2,2 mm).

#### Scenario: Diferencia con el promedio según el sexo
- **WHEN** la paciente es de sexo femenino y se registra AMS 50,1 mm y AMI 45,8 mm
- **THEN** se muestra e imprime "promedio 52,4 mm · −2,3" para el AMS y "promedio 46,1 mm · −0,3" para el AMI

#### Scenario: Sin sexo indicado
- **WHEN** el paciente no tiene sexo indicado
- **THEN** no se calcula la diferencia del AMS ni del AMI y se muestran los dos promedios como referencia

#### Scenario: Diferencia de las distancias WALA–EV
- **WHEN** se registra la distancia WALA–EV del 1er molar inferior en 2,6 mm
- **THEN** se muestra e imprime la norma 2,0 mm y la diferencia "+0,6"
- **AND** una distancia sin valor no muestra diferencia

#### Scenario: Ancho X ideal escrito a mano
- **WHEN** el usuario escribe el ancho X ideal
- **THEN** se guarda tal cual, sin calcularse a partir de otras medidas

#### Scenario: Medidas fuera de rango
- **WHEN** se guarda una medida negativa, de 100 mm o más, o con dos decimales
- **THEN** el sistema responde `400` con el error en ese campo y no guarda

#### Scenario: Historias guardadas antes del cambio
- **WHEN** se abre una historia guardada antes de existir el análisis de modelos
- **THEN** el paso 5 aparece vacío y la historia se guarda sin errores

#### Scenario: Hoja impresa del análisis transversal
- **WHEN** se imprime una historia
- **THEN** después de la hoja del análisis oclusal sale "ANÁLISIS DE MODELOS · Análisis Transversal de los Modelos" con paciente, edad y sexo, las medidas, las diferencias calculadas, el texto de referencia de los promedios y la interpretación
