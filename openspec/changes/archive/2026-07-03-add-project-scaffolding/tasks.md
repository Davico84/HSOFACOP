## 1. Backend — proyecto base (Maven · Spring Boot 4.0.6)

- [x] 1.1 Generar `modules/backend/` con `pom.xml` (Java 25, Spring Boot 4.0.6) y Maven Wrapper (`mvnw`, `mvnw.cmd`, `.mvn/`)
- [x] 1.2 Añadir dependencias base: web, actuator, data-jpa, validation, security + java-jwt, cache + caffeine, flyway (+ postgresql module), lombok, postgresql (runtime). (springdoc y spring-ai diferidos, ver notas al final)
- [x] 1.3 Crear la aplicación principal y los paquetes de capas: `presentation` (controller, dto), `infra` (config, security, service, utils/mappers), `persistence` (entity, repository, specification)
- [x] 1.4 Configuración única (sin perfiles): `application.yml` con placeholders `${VAR}` para todos los valores; `secrets.properties` (ignorado) cargado vía `spring.config.import`, con `secrets.properties.example` versionado
- [x] 1.5 Configurar Flyway (`spring.jpa.hibernate.ddl-auto=none`) y migración inicial `db/migration/V1__init.sql`
- [x] 1.6 Configurar Actuator health (endpoint de salud público). springdoc/Swagger diferido (sin release estable para Spring Boot 4, ver notas)
- [x] 1.7 Añadir `compose.yaml` mínimo con PostgreSQL para desarrollo local

## 2. Backend — pruebas (test slices + Testcontainers)

- [x] 2.1 Configurar Testcontainers (PostgreSQL) + `spring-boot-testcontainers`; base común de test (`@ServiceConnection`)
- [x] 2.2 Test de contexto/arranque (`@SpringBootTest`) sobre Testcontainers — cubre "Arranque en perfil dev"
- [x] 2.3 Test webmvc del endpoint de salud → 200 OK
- [x] 2.4 Test de Flyway que verifica migración en base limpia (contenedor) y que Hibernate no altera el esquema
- [x] 2.5 Verificar `./mvnw -B verify` en verde (requiere Docker local para Testcontainers)

## 3. Frontend — proyecto base (Vite · React 19 · TS)

- [x] 3.1 Generar `modules/frontend/` con `package.json` (scripts dev/build/preview/lint/typecheck/test/validate) portando versiones del template FixRiver
- [x] 3.2 Portar configs: `vite.config.ts`, `tsconfig*`, `eslint.config`, Tailwind/PostCSS
- [x] 3.3 Crear estructura `src/{layouts,screens,modules(core/),store,routes,styles}` con una `home` mínima y `routes` base
- [x] 3.4 Portar tooling de test: `vitest.config.ts`, `src/test/{setup.ts,utils.tsx,mocks/handlers.ts,mocks/server.ts}` (MSW)
- [x] 3.5 Instalar dependencias y generar `pnpm-lock.yaml`

## 4. Frontend — pruebas

- [x] 4.1 Prueba con React Testing Library que renderiza la app (home) — cubre "Prueba base con MSW"
- [x] 4.2 Verificar `pnpm build` y `pnpm validate` en verde

## 5. Validación de commits (raíz)

- [x] 5.1 `package.json` raíz mínimo con devDeps de hooks (husky, @commitlint/cli, @commitlint/config-conventional)
- [x] 5.2 Configurar husky + hook `commit-msg` que corre commitlint
- [x] 5.3 Hook `pre-commit` que delega en el `lint-staged` del frontend (acotado a `modules/frontend/`)
- [x] 5.4 Probar: commit inválido se rechaza; commit `feat(scope): ...` pasa

## 6. CI y cierre

- [x] 6.1 Verificar que los jobs `backend` y `frontend` de `.github/workflows/ci.yml` se activan al existir los módulos
- [x] 6.2 `openspec validate add-project-scaffolding --strict` en verde
- [x] 6.3 Actualizar `docs/architecture.md` §6 (marcar andamiaje hecho) y crear `.env.example`

---

## Notas de implementación (backend, grupos 1–2)

- **springdoc/Swagger diferido**: no hay release estable de springdoc-openapi para Spring Boot 4 al momento del scaffolding. El endpoint de salud usa Actuator. Se añadirá springdoc cuando exista versión compatible (o en la capacidad que exponga la primera API).
- **spring-ai diferido**: es para el chatbot, fuera de alcance del roadmap actual (`docs/roadmap.md`). Se añadirá con esa capacidad.
- **Testcontainers vs Docker Desktop 29**: los tests de integración usan `@Testcontainers(disabledWithoutDocker = true)` y **se saltan** en este entorno. docker-java (Testcontainers) recibe HTTP 400 del pipe por defecto de Docker Desktop 29.6.1 (el CLI funciona porque usa el contexto `desktop-linux`). Fix: en Docker Desktop → Settings → Advanced, habilitar **"Allow the default Docker socket to be used"** (bridea `//./pipe/docker_engine`); luego `./mvnw verify` ejecuta los ITs. Alternativas: Testcontainers Cloud.
- Se usó `@DynamicPropertySource` (en vez de `@ServiceConnection`) para inyectar la conexión del contenedor, por robustez con la config de secretos.
- **Flyway en Boot 4**: la autoconfiguración vive en el módulo `org.springframework.boot:spring-boot-flyway` (aparte); es obligatorio declararlo o Flyway no se ejecuta.
- **Verificación de arranque (2026-07-02)**: hecha manualmente contra PostgreSQL nativo (health 200 UP + Flyway `v1-init` aplicada + tablas creadas), dado que los ITs Testcontainers no corren en este entorno (Docker Desktop 29). En CI (Linux) los ITs cubren esto.

## Notas de implementación (frontend, grupos 3–4)

- **Layout monorepo**: backend y frontend movidos a `modules/backend` y `modules/frontend` (raíz más limpia, alinea con template FixRiver). CI, .gitignore y docs actualizados.
- **Deps lean**: se portó el core del stack (React 19, router v7, react-query, zustand, react-hook-form, zod, tailwind, tooling Vitest/MSW/ESLint). Radix/framer/recharts/stomp-sockjs/playwright se añaden con la capacidad que los use.
- **Vitest pool `threads`**: en Windows el pool por defecto (`forks`) daba "Timeout waiting for worker to respond"; se fijó `pool: 'threads'`.
