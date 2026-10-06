> Commits separados por scope (docs/commits.md): configuración (chore) · frontend · docs. Antes de tocar el frontend, skill `frontend-guard`.

## 1. Configuración

- [x] 1.1 `project.config.schema.json`: `contact` opcional (`whatsapp` 8–15 dígitos, `email`, `minProperties: 1`, `additionalProperties: false`)
- [x] 1.2 `lib/config.mjs`: validadores `whatsapp` y `email`, aplicados solo si `contact` existe; `config.test.mjs` con válido, ausente, número con `+`/espacios, correo inválido y `contact` vacío
- [x] 1.3 `project.config.json` con `51959396384` y `davicova84@gmail.com`; `pnpm project:apply` (solo `.template/applied.json`)

## 2. Frontend

- [x] 2.1 `config/project.ts`: `contact?: { whatsapp?: string; email?: string }`
- [x] 2.2 `core/components/ContactLinks` (tonos `onBrand`/`default`, título opcional, enlace de WhatsApp con mensaje y `sr-only` de nueva pestaña, `mailto:`), con su test: enlaces y atributos, solo correo, solo WhatsApp, sin contacto no renderiza
- [x] 2.3 `BrandPanel` con el contacto; `AuthLayout` con el contacto bajo el formulario solo en móvil (`lg:hidden`); `ServerWarmupScreen` en `stuck` con el contacto o el texto actual
- [x] 2.4 Tests (uno por scenario): panel de marca, móvil sin repetir (clases `lg:hidden` / panel `hidden lg:flex`), espera larga con contacto, sin contacto (config simulada). `pnpm validate` verde
- [x] 2.5 Capturas con Playwright (login escritorio y móvil, espera larga; claro y oscuro)

## 3. Docs

- [x] 3.1 `docs/frontend.md` §4.1: `ContactLinks`; nota de privacidad en `docs/deployment.md` (contacto público)
- [x] 3.2 Al archivar: `docs/vision.md` ✅
