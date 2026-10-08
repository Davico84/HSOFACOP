## Context

- Producción: Neon Free (PostgreSQL 16, `us-east-2`, conexión directa con `sslmode=require`), el cómputo se suspende tras ~5 min sin uso. Backend en Render, frontend en Vercel.
- Los datos son historias clínicas (datos de salud): una copia expuesta es más grave que una copia perdida.
- **El repositorio es público.** Los artifacts de Actions de un repo público los puede descargar cualquier usuario autenticado de GitHub, y los logs son públicos.
- El repositorio también es una **plantilla** (`.template/`, `pnpm project:apply`): lo que se agregue debe ser genérico y no fallar en un proyecto derivado sin configurar.
- No hay presupuesto: todo debe caber en planes gratuitos.

## Goals / Non-Goals

**Goals:** una copia diaria fuera de Neon, ilegible sin una clave que solo tiene el responsable, verificada por restauración, con una guía para recuperar.

**Non-Goals:**
- restauración automática sobre producción (siempre manual y a una base nueva);
- copias cada pocos minutos o replicación (para eso está la restauración a un punto anterior de Neon, de ventana corta);
- copias de Render o Vercel (no guardan estado: se reconstruyen desde el repo).

## Decisions

### Dónde: artifacts de GitHub Actions
- Workflow `.github/workflows/db-backup.yml`, `schedule` diario a las **08:00 UTC** (03:00 en Lima, sin uso) y `workflow_dispatch`.
- Artifact `db-backup-<AAAA-MM-DD>` con `retention-days: 90` (el máximo para repos públicos).
- Alternativas descartadas:
  - Cloudflare R2 / Backblaze B2: otra cuenta, otras claves y otro panel para una base de pocos MB;
  - Google Drive con `rclone`: token OAuth que caduca y se guarda como secreto;
  - commitear la copia al repo: queda para siempre en la historia de un repo público, aunque esté cifrada.
- **Más allá de 90 días**: la guía pide bajar una copia al mes a un disco propio (el archivo cifrado; se puede guardar en cualquier lado).

### Cifrado: `age` con clave pública
- El runner cifra con `age -r "$BACKUP_AGE_RECIPIENT"`. `BACKUP_AGE_RECIPIENT` es la **clave pública** y va como **variable** del repo (no es secreta).
- La **clave privada** se genera en la PC del responsable (`age-keygen`) y **nunca** entra a GitHub. Copia de la clave en un segundo lugar seguro (p. ej. gestor de contraseñas): sin ella las copias son inútiles.
- Alternativa descartada: `gpg --symmetric` con la frase como secreto de GitHub. Funciona, pero quien controle el repo (o un workflow comprometido) podría descifrar; con `age` el runner solo puede cifrar.
- `age` sale de los paquetes de Ubuntu del runner (`apt-get install age`).

### Volcado: `pg_dump` con credencial de solo lectura
- Rol de Neon `backup_reader` con `pg_read_all_data` (predefinido desde PG 14), sin permisos de escritura. Se crea una vez desde el SQL Editor de Neon (la guía trae el SQL). Si Neon no permitiera otorgar ese rol, alternativa documentada: `GRANT USAGE` en el esquema y `GRANT SELECT` en todas las tablas y secuencias, con `ALTER DEFAULT PRIVILEGES` para las futuras.
- Secreto `BACKUP_DATABASE_URL`: URL libpq **directa** (`postgresql://backup_reader:…@<host-directo>/<base>?sslmode=require`), no el `-pooler`.
- `pg_dump --format=custom --no-owner --no-acl`, con el cliente de la misma versión mayor (contenedor `postgres:16`), así no depende del cliente que traiga Ubuntu.
- Despertar la base una vez al día consume unos minutos de cómputo; el cupo gratuito lo cubre de sobra.

### Verificación: restaurar antes de subir
- El job tiene un servicio `postgres:16` vacío. Orden de pasos:
  1. volcado a un archivo en `$RUNNER_TEMP`;
  2. `pg_restore --no-owner --no-acl --exit-on-error` en el servicio;
  3. comprobaciones con `psql`:
     - la versión máxima de `flyway_schema_history` (aplicadas con éxito) es la del **último `V<n>__*.sql` del repositorio**;
     - existen las tablas de la aplicación (`users` y `orthodontic_records` como mínimo; la lista sale de un archivo del workflow, no del código);
  4. cifrado a `<archivo>.age` y borrado del volcado sin cifrar;
  5. subida del `.age`.
- Cualquier paso que falle corta el job antes de la subida. GitHub envía un correo cuando falla un workflow programado.
- Comparar con la última migración del repo detecta también una copia de una base atrasada (p. ej. el despliegue no corrió).
- Las comprobaciones no imprimen conteos ni datos (logs públicos): solo "ok" o el nombre de lo que falta.

### Sin configuración, se omite
- Primer paso: si falta `BACKUP_DATABASE_URL` o `BACKUP_AGE_RECIPIENT`, escribe "Copia omitida: falta configuración" en `$GITHUB_STEP_SUMMARY` y los demás pasos se saltan (`if:` sobre una salida del paso). El job termina en verde.
- Nada específico del proyecto en el workflow (nombres genéricos), así sirve igual en un proyecto derivado de la plantilla.

### Logs sin secretos
- La URL va solo por variable de entorno (`PGURL`/argumento de `pg_dump` desde `env`), nunca en `run:` literal; Actions enmascara el secreto.
- Sin `set -x`. Ninguna salida de `psql` con datos.

### Riesgos operativos documentados
- **GitHub desactiva los workflows programados de un repo público tras 60 días sin actividad** (avisa por correo antes). La guía lo indica: volver a activarlo desde la pestaña Actions o con cualquier commit.
- Restaurar: `gh run download` (o la pestaña Actions) → `age -d -i clave.txt` → `pg_restore` en una **rama nueva de Neon** o en una PostgreSQL local (Docker). Nunca sobre la base de producción en uso; si hay que reemplazarla, se apunta `DB_URL` de Render a la rama restaurada.

## Risks / Trade-offs

- **Perder la clave privada** deja las copias inservibles: la guía exige guardarla en dos lugares.
- **90 días de retención**: lo anterior depende de la copia mensual manual.
- **Una copia al día**: se puede perder hasta un día de trabajo si no alcanza la restauración a un punto anterior de Neon.
- **Dependencia de GitHub** para guardar las copias: aceptable; la copia mensual a un disco propio cubre una caída o pérdida de la cuenta.
- **Pruebas**: el workflow no se prueba con tests de unidad. Se verifica ejecutándolo a mano (una vez sin configuración y otra configurado) y restaurando una copia en local siguiendo la guía.
