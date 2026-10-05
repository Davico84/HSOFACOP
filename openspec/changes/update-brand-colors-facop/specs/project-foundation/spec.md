## ADDED Requirements

### Requirement: Paleta de la marca FACOP
El tema SHALL usar la paleta oficial de FACOP: Roxo `#832C87` como color principal en modo claro (botones, enlaces, foco y elementos activos), Grafite `#3C3C3B` como color de texto, y solo grises neutros (sin tinte) para fondos, superficies y bordes. Ningún token SHALL usar tonos fuera de la paleta salvo los colores semánticos de error, éxito y aviso. En modo oscuro el color principal SHALL ser un Roxo aclarado. Todo par de texto sobre su fondo del tema (texto, texto secundario, texto sobre el color principal, sobre secundario y sobre acento) SHALL cumplir contraste WCAG AA (4,5:1) en claro y en oscuro. La hoja impresa SHALL imprimir texto y líneas en Preto `#000000`.

#### Scenario: Color principal en modo claro
- **WHEN** se compila el tema en modo claro
- **THEN** `--primary` es el Roxo `#832C87` y `--foreground` es el Grafite `#3C3C3B`

#### Scenario: Sin turquesa
- **WHEN** se revisan los tokens de color claros y oscuros
- **THEN** ninguno, salvo `destructive`, `success` y `warning`, tiene un tono fuera del Roxo o de los grises neutros (tampoco el degradado del login)

#### Scenario: Contraste de lectura
- **WHEN** se calcula el contraste de cada par texto/fondo del tema (`foreground`/`background`, `muted-foreground`/`background`, `muted-foreground`/`muted`, `primary-foreground`/`primary`, `secondary-foreground`/`secondary`, `accent-foreground`/`accent`) en claro y en oscuro
- **THEN** todos alcanzan al menos 4,5:1

#### Scenario: Gris oficial no usado para texto
- **WHEN** se elige el color de texto secundario
- **THEN** es un gris neutro con contraste AA (el Gris `#808080`, de 3,9:1 sobre blanco, no se usa para texto)

#### Scenario: Modo oscuro
- **WHEN** el usuario activa el modo oscuro
- **THEN** el color principal es un Roxo aclarado legible sobre el fondo oscuro y las superficies son grises neutros oscuros

#### Scenario: Logos oficiales
- **WHEN** se abre la app en modo claro, en modo oscuro o en el login
- **THEN** se ve el logo oficial de FACOP según el fondo: positivo (escudo Roxo y "FACOP" en Grafite) sobre fondo claro, en blanco sobre fondo oscuro o Roxo, y el escudo Roxo como favicon y en la barra contraída

#### Scenario: Panel del login
- **WHEN** se abre el inicio de sesión en escritorio
- **THEN** el panel de marca es Roxo liso con el logo en blanco, sin degradado ni turquesa

#### Scenario: Hoja impresa en negro
- **WHEN** se imprime una historia
- **THEN** el texto y las líneas salen en `#000000` y la hoja conserva su diseño
