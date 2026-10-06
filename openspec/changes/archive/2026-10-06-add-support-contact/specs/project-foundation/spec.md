## ADDED Requirements

### Requirement: Contacto de soporte en las pantallas de acceso
El proyecto SHALL poder configurar un contacto de soporte opcional en `project.config.json` (`contact.whatsapp` con solo dígitos y código de país, `contact.email`). Con contacto configurado, las pantallas sin sesión SHALL mostrar "¿Necesitas ayuda?" con un enlace a WhatsApp (en otra pestaña, con un mensaje inicial que nombra el proyecto) y un enlace al correo, visibles en escritorio y en móvil sin repetirse. La espera larga del arranque en frío SHALL ofrecer ese contacto. Sin contacto configurado, no se muestra el bloque.

#### Scenario: Contacto en el panel de marca
- **WHEN** se abre el login en escritorio con contacto configurado
- **THEN** el panel de marca muestra "¿Necesitas ayuda?"
- **AND** un enlace "Escríbenos por WhatsApp" a `https://wa.me/<número>?text=` con el mensaje inicial, que se abre en otra pestaña con `rel="noopener noreferrer"`
- **AND** un enlace `mailto:` con el correo

#### Scenario: Contacto en móvil sin repetir
- **WHEN** se abre el login o el registro en móvil
- **THEN** el contacto aparece debajo del formulario
- **AND** en escritorio ese bloque bajo el formulario no se muestra (está en el panel)

#### Scenario: Contacto en la espera larga
- **WHEN** la pantalla de arranque llega a "Está tardando más de lo normal" con contacto configurado
- **THEN** muestra "Si el problema continúa, escríbenos:" con los enlaces de contacto

#### Scenario: Sin contacto configurado
- **WHEN** `project.config.json` no tiene `contact`
- **THEN** no se muestra el bloque de contacto
- **AND** la espera larga conserva "Si el problema continúa, avisa al administrador."

#### Scenario: Contacto inválido
- **WHEN** `contact.whatsapp` tiene caracteres que no son dígitos o `contact.email` no es un correo
- **THEN** la validación de la configuración (`pnpm project:apply`) lo rechaza con un mensaje por campo
