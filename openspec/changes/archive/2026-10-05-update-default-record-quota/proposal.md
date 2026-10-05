## Why

Hoy una cuenta nueva nace **sin límite** de historias clínicas: cualquiera que se registre puede crear todas las que quiera hasta que un ADMIN le ponga un cupo. La clínica quiere el control al revés: todo tratante nuevo empieza con **1 historia** y el ADMIN amplía el cupo cuando corresponde.

La numeración por tratante (`AEO-001` para Jaime, `AEO-001` para Karen) **ya funciona así** (correlativo por autor con `UNIQUE (author_id, record_seq)` y test `numbers_are_independent_per_user`): no forma parte de este cambio.

## What Changes

- **Cupo inicial al registrarse**: toda cuenta nueva (`USER`) nace con un cupo de historias igual al **cupo inicial configurado**, que por defecto es **1**.
- **Configurable** sin tocar código: propiedad `app.records.default-quota` (variable `RECORDS_DEFAULT_QUOTA`), entero 0–9999; vacía = las cuentas nuevas nacen sin límite (comportamiento anterior).
- **Las cuentas existentes no cambian**: conservan su cupo actual (sin límite o el que les asignó el ADMIN). Sin migración de datos.
- El ADMIN sigue pudiendo ampliar, reducir o quitar el cupo desde "Usuarios", como hoy.
- Al llegar a su primera historia, el tratante ve el aviso ya existente ("Alcanzaste el máximo de 1 historia clínica. Comunícate con el administrador para solicitar más.").

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `users`: el requisito "Cupo de historias clínicas por usuario" cambia "por defecto ninguna cuenta tiene límite" por el cupo inicial configurable (1 por defecto) para cuentas nuevas.
- `orthodontic-records`: en "Límite de historias por tratante", el scenario "Sin límite por defecto" pasa a "Cuenta sin cupo" (ya no es el valor por defecto).

## Impact

- Backend: `AuthService.register` asigna el cupo inicial; `ProjectProperties` (o una propiedad `app.records`) con `default-quota`; `application.yml` y `secrets.properties.example` documentan `RECORDS_DEFAULT_QUOTA`.
- Tests: los de integración que crean varias historias con usuarios recién registrados corren con el cupo inicial vacío (sin límite) en el perfil de test; tests nuevos prueban el cupo inicial 1 y vacío. Los E2E con backend real crean una sola historia por usuario nuevo, salvo el de cupo (ya asigna el suyo).
- Sin cambios de contrato, de frontend ni de base de datos.
- Guías: `docs/domain.md` (regla de cupo inicial).

## Non-goals

- Cambiar el cupo de las cuentas existentes.
- Pantalla para editar el cupo inicial (se configura en el despliegue).
- Cambiar la numeración (ya es independiente por tratante).
