## Why

Las historias clínicas viven solo en Neon (plan gratuito). "No caduca" no es una copia de seguridad: un borrado por error, un problema de la cuenta o un cambio del plan pueden perderlas, y la restauración a un punto anterior del plan gratuito cubre poco tiempo. Hoy no existe ninguna copia fuera de Neon ni una restauración probada.

## What Changes

- **Copia diaria automática** con un workflow programado de GitHub Actions (más ejecución manual):
  - `pg_dump` (formato custom) de la base de producción con una credencial **de solo lectura**;
  - **cifrada** con `age` a una clave pública; la clave privada queda solo con el responsable, fuera del repo y de GitHub. El repositorio es público: nada sin cifrar sale del runner ni aparece en los logs;
  - guardada como artifact del workflow con retención de 90 días.
- **Restauración verificada en cada copia**: antes de subirla, el mismo job la restaura en una PostgreSQL 16 vacía y comprueba que están las migraciones y las tablas; si falla, el workflow falla (GitHub avisa por correo).
- **Sin configuración, no corre**: un proyecto derivado de la plantilla sin los secretos lo salta sin fallar.
- **Guía de restauración** en `docs/deployment.md`: descargar, descifrar y restaurar en una rama nueva de Neon o en local, y la copia mensual a un disco propio (más allá de los 90 días).
- Sin cambios de código de la aplicación.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `cloud-deployment`: nuevos requisitos "Copia diaria cifrada de la base fuera del proveedor" y "Restauración de la copia verificada".

## Impact

- Nuevo `.github/workflows/db-backup.yml`.
- Configuración (manual, una vez):
  - rol de solo lectura en Neon;
  - secreto `BACKUP_DATABASE_URL` y variable `BACKUP_AGE_RECIPIENT` (clave pública) en GitHub;
  - par de claves `age` generado en la PC del responsable.
- Docs: `docs/deployment.md` (copias y restauración).
- Sin cambios en backend, frontend, contrato ni esquema.
