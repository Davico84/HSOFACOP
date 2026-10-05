> Solo frontend (sin backend ni contrato). Commits separados por scope (docs/commits.md).

## 1. Frontend

- [ ] 1.1 `project.config.json` → `brand.colors` (Roxo, anillo, degradado Roxo → Roxo profundo, claro y oscuro) y `pnpm project:apply` para regenerar el bloque `@template:brand`
- [ ] 1.2 `globals.css`: neutrales sin tinte, Grafite de texto, gris AA para texto secundario, `secondary`/`accent` en tintes de Roxo (claro y oscuro); token `--ink` (`#000000`) registrado como `--color-ink`
- [ ] 1.3 Hoja impresa: `text-ink`/`border-ink` en lugar de `text-foreground`/`border-foreground`; verificar con Edge headless + PyMuPDF que solo cambia el color
- [ ] 1.4 `theme.test.ts`: Roxo y Grafite exactos, sin tonos fuera de la paleta (salvo semánticos) y contraste AA de los pares texto/fondo en claro y oscuro; `pnpm validate` verde
- [ ] 1.5 Revisión visual en claro y oscuro (login, listado, formulario, usuarios, vista previa) a 375 y 1280 px

## 2. Docs y cierre

- [x] 2.1 `docs/vision.md`: estado 🚧 del change
- [ ] 2.2 `docs/frontend.md`: paleta FACOP (tabla de marca, gris de texto AA, `ink` para impresión)
- [ ] 2.3 Al archivar — `docs/vision.md` ✅ (sin cambios de dominio)
