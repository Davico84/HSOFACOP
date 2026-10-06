## Context

- `project.config.json` es la única fuente de la marca (`config/project.ts` la expone como `project`). Tiene esquema JSON (`additionalProperties: false`) y validador propio (`validateConfig`), y el CI ensaya la plantilla con otra identidad (`template.yml`): un campo nuevo **obligatorio** rompería ese ensayo y a cualquier proyecto creado desde la plantilla.
- `BrandPanel` (panel Roxo) solo se ve desde `lg`; en móvil el login muestra el logo arriba y el formulario.
- `ServerWarmupScreen`, en el estado `stuck`, dice "Si el problema continúa, avisa al administrador.".

## Goals / Non-Goals

**Goals:** un contacto de soporte visible en las pantallas sin sesión (escritorio y móvil) y en la espera larga; configurable sin tocar código; opcional.

**Non-Goals:** formulario de contacto, chat, contacto dentro de la app con sesión, varios contactos o horarios.

## Decisions

### Configuración opcional y validada
- `contact?: { whatsapp?: string; email?: string }`, con al menos uno de los dos si la sección existe.
- `whatsapp`: solo dígitos, 8–15 (formato de `wa.me`: código de país sin `+` ni espacios). `email`: formato simple `^[^\s@]+@[^\s@]+\.[^\s@]+$`.
- Esquema: propiedad `contact` (`additionalProperties: false`, `minProperties: 1`), no en `required`. `validateConfig`: valida solo si está presente.
- Sin contacto, `ContactLinks` no renderiza nada y la espera larga conserva el texto actual.

### `ContactLinks` genérico en core
- No conoce el dominio: lee `project.contact` y `project.name`. Variante visual por prop (`tone: "onBrand" | "default"`): sobre el Roxo usa `text-white/80` con foco blanco; sobre el fondo, `text-muted-foreground` y el anillo `ring`.
- WhatsApp: `https://wa.me/<dígitos>?text=<encodeURIComponent("Hola, necesito ayuda con " + project.name)>`, `target="_blank"`, `rel="noopener noreferrer"`. El nombre accesible avisa la nueva pestaña: texto visible "Escríbenos por WhatsApp" + `<span className="sr-only">(se abre en otra pestaña)</span>`.
- Correo: `mailto:<email>`, mismo tab; texto visible = la dirección.
- Iconos de `lucide-react` (`MessageCircle`, `Mail`) con `aria-hidden`.
- Estructura: título "¿Necesitas ayuda?" y una lista (`<ul>`) de enlaces.

### Dónde
- `BrandPanel`: bajo la descripción, separado con un borde `border-white/20` (tono `onBrand`).
- `AuthLayout`: debajo del formulario y del pie, **solo en móvil** (`lg:hidden`), tono `default`; en escritorio ya está en el panel. Así nunca aparece dos veces.
- `ServerWarmupScreen` en `stuck`: si hay contacto, "Si el problema continúa, escríbenos:" + `ContactLinks` (tono `default`, sin título); si no, el texto actual. En escritorio también está en el panel; se acepta la repetición porque en ese estado el contacto es la acción principal después de "Reintentar".
- Offline: no se añade (sin red no abre WhatsApp ni el correo de forma útil).

## Risks / Trade-offs

- Datos públicos: los bots recogen correos y números expuestos. Mitigación: contacto de soporte o institucional (documentado); se cambia solo en `project.config.json`.
- `wa.me` sin WhatsApp instalado abre WhatsApp Web; aceptable.
