# API scaling notes

## Cambios implementados

- Caché de lecturas calientes en memoria para:
  - comunidades populares (`hot:communities:popular`)
  - feed inicial (`hot:feed:initial:*`)
- Índices Prisma agregados para consultas de feed/comunidad/reportes.
- Cola asíncrona en Redis para jobs futuros:
  - `jobs:notifications`
  - `jobs:ranking`
- Estrategia de paginación centralizada en `common/pagination.constants.ts`.
- Protección API global:
  - guard de rate limiting por IP+ruta
  - timeout global de 5 segundos
  - filtro de error uniforme
