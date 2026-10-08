> Rama `change/add-database-backups` desde `main`, PR a `main` (docs/commits.md §5b). Sin código de la app. Commits por scope: ci · docs. Las tareas 2.x las hace el responsable en Neon, su PC y GitHub (guiado).

## 1. Workflow

- [ ] 1.1 `.github/workflows/db-backup.yml`: `schedule` diario 08:00 UTC + `workflow_dispatch` (sin `pull_request`), `permissions: contents: read`, `concurrency` sin cancelar en curso; solo `actions/checkout` y `actions/upload-artifact` fijadas por SHA
- [ ] 1.2 Paso de configuración: sin `BACKUP_DATABASE_URL` o `BACKUP_AGE_RECIPIENT` → "Copia omitida: falta configuración" en el resumen y el resto se salta, en verde
- [ ] 1.3 Volcado con `postgres:16` (`pg_dump --format=custom --no-owner --no-acl`) a `$RUNNER_TEMP/backup`, la URL solo por `env` y `-e DATABASE_URL`
- [ ] 1.4 Servicio `restore` (`postgres:16`, `POSTGRES_DB/USER/PASSWORD` efímeros, healthcheck `pg_isready`, puerto 5432) + espera con `pg_isready`; `pg_restore --no-owner --no-acl --exit-on-error`; comprobaciones sin imprimir datos:
  - versión: `n` de `V<n>__*.sql` de `MIGRATIONS_DIR` por regex y `sort -n` contra `max(version::numeric)` con `success`;
  - tablas: todas las de `CREATE TABLE` de las migraciones presentes en `public`;
  - probar el script de versión con nombres `V9`, `V10`, `V15` (que gane `V15`).
- [ ] 1.5 Cifrado con `age -r "$BACKUP_AGE_RECIPIENT"`, borrado del volcado sin cifrar, subida `db-backup-<AAAA-MM-DD>` (`retention-days: 90`) solo si todo lo anterior pasó; paso final `if: always()` que borra `$RUNNER_TEMP/backup`
- [ ] 1.6 Nombres genéricos (sirve igual en un proyecto derivado de la plantilla); revisar que `pnpm project:apply` no necesita tocarlo

## 2. Configuración (responsable, guiado)

- [ ] 2.1 Instalar `age` y generar el par (`age-keygen -o hsfacop-backup.key`); guardar la clave privada en dos lugares fuera del repo
- [ ] 2.2 Neon: crear `backup_reader` con `pg_read_all_data` (o la alternativa de `GRANT SELECT`); comprobar que un `INSERT` con ese rol falla
- [ ] 2.3 GitHub: secreto `BACKUP_DATABASE_URL` (URL directa, `sslmode=require`) y variable `BACKUP_AGE_RECIPIENT` (clave pública)

## 3. Verificación

> `schedule` y `workflow_dispatch` solo se ofrecen con el workflow en la rama por defecto: la verificación se hace **después del merge a `main`**, en este orden.

- [ ] 3.1 Sin configuración: ejecutarlo a mano → omitido en verde
- [ ] 3.2 Con la variable y un secreto **inválido** (URL a un host inexistente) → rojo, sin artifact y con el paso de limpieza ejecutado
- [ ] 3.3 Con el secreto correcto → artifact `.age`; logs sin URL ni datos
- [ ] 3.4 Restaurar ese artifact en una PostgreSQL local siguiendo la guía y comprobar que están las historias

## 4. Docs

- [ ] 4.1 `docs/deployment.md`: sección de copias (qué, dónde, retención, clave privada en dos lugares, copia mensual a disco propio, 60 días sin actividad: cómo detectarlo y `gh workflow enable`) y guía de restauración (descargar, descifrar, restaurar en rama de Neon o local, cómo apuntar Render a la rama restaurada); quitar el aviso "van en `add-database-backups`"
- [ ] 4.2 Al archivar: `docs/vision.md` ✅
