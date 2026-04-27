# Entrega para ingeniería

## Contexto

El repositorio es una base inicial bien estructurada, no una red social terminada. El objetivo es que el equipo pueda continuar por fases sin rearmar la arquitectura.

## Estado actual

- Docker Compose definido.
- Web inicial navegable.
- API NestJS con health y auth base.
- Prisma schema preparado para el MVP.
- Seed inicial para admin, universidad, facultad, carrera, comunidades, categorías y tags.
- Documentación base incluida.

## Pendientes técnicos prioritarios

1. Validar schema con `prisma validate`.
2. Crear primera migración.
3. Conectar Mailhog al flujo real de verificación.
4. Agregar guards JWT y decoradores `CurrentUser`.
5. Implementar CRUD real de perfiles.
6. Implementar posts con comentarios y reacciones.
7. Implementar comunidades.
8. Implementar upload con MinIO.
9. Implementar marketplace básico.
10. Implementar reportes y panel de moderación.

## Decisiones cerradas

- Puerto frontend: 3000.
- Puerto API: 4000.
- PostgreSQL: 5432.
- Redis: 6379.
- MinIO: 9000/9001.
- Mailhog: 1025/8025.
- Sin dominio en MVP local.
- Sin hosting en MVP local.
- Sin pagos automáticos.
- Sin `orders` ni `order_items`.
- Sin `seller_profiles`.

