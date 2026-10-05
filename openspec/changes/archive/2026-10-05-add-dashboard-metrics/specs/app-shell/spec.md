## REMOVED Requirements

### Requirement: Dashboard de inicio con datos de ejemplo
**Reason**: Lo reemplaza la capacidad `dashboard` con métricas reales por rol.
**Migration**: Inicio muestra `DashboardFeature` de `modules/dashboard`, alimentado por `GET /api/dashboard/me` (USER) y `GET /api/dashboard/admin` (ADMIN); se borran los datos de ejemplo (`sampleData`, `SampleDataBanner`, `RecentActivity`).
