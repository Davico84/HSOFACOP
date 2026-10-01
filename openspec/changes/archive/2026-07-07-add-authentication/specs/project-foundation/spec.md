## MODIFIED Requirements

### Requirement: Estructura arquitectónica establecida
El código base SHALL seguir la arquitectura definida en `docs/architecture.md`: en el backend, la **lógica de negocio** vive separada de los **adaptadores técnicos** (`infra` es solo para lo técnico); en el frontend, la organización es por pantallas/módulos.

#### Scenario: Capas del backend
- **WHEN** se inspecciona el árbol de paquetes del backend
- **THEN** la lógica de negocio reside en `service.<dominio>` (no bajo `infra`)
- **AND** `infra` contiene únicamente adaptadores técnicos (p. ej. `config`, `security`, `storage`, `mail`)
- **AND** `presentation` no importa directamente de `persistence`
- **AND** `persistence` no depende de `presentation` ni de `service`
- **AND** `service` no depende de `presentation`

#### Scenario: Estructura del frontend
- **WHEN** se inspecciona `modules/frontend/src`
- **THEN** existen los directorios `layouts`, `screens`, `modules`, `store`, `routes` y `styles`
- **AND** `modules/core` no depende de otros módulos
