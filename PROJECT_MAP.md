# CrunEdu — mapa rápido del proyecto

Este archivo está pensado para que cualquier ingeniero abra el repositorio y entienda la intención del proyecto en menos de 5 minutos.

## Qué es

CrunEdu es una red social educativa universitaria con una tienda básica administrada por la plataforma.

## Qué NO es

- No es aula virtual formal.
- No es web oficial de una universidad.
- No es Mercado Libre completo.
- No tiene pagos automáticos en el MVP.
- No tiene vendedores externos en el MVP.

## Módulos del MVP

| Módulo | Carpeta API | Estado |
|---|---|---|
| Health | `apps/api/src/modules/health` | Funcional |
| Auth | `apps/api/src/modules/auth` | Registro/login base |
| Users/Profile | `apps/api/src/modules/users` | Scaffold |
| Posts | `apps/api/src/modules/posts` | Scaffold |
| Communities | `apps/api/src/modules/communities` | Scaffold |
| Questions | `apps/api/src/modules/questions` | Scaffold |
| Documents | `apps/api/src/modules/documents` | Scaffold |
| Marketplace | `apps/api/src/modules/marketplace` | Scaffold |
| Reports | `apps/api/src/modules/reports` | Scaffold |
| Search | `apps/api/src/modules/search` | Scaffold |

## Frontend

| Ruta | Propósito |
|---|---|
| `/` | Landing page |
| `/app` | Demo del feed principal |
| `/app/comunidades` | Vista base de comunidades |
| `/app/preguntas` | Vista base de preguntas |
| `/app/apuntes` | Vista base de documentos |
| `/app/tramites` | Vista base de trámites |
| `/app/momentos` | Vista base de momentos |
| `/app/tienda` | Vista base de tienda |
| `/legal/terminos` | Borrador legal inicial |

## Base de datos

El modelo está en:

```txt
packages/database/prisma/schema.prisma
```

La semilla inicial está en:

```txt
packages/database/prisma/seed.ts
```

## Orden de trabajo recomendado

1. Levantar Docker.
2. Ejecutar migración Prisma.
3. Ejecutar seed.
4. Probar `/api/health`.
5. Probar landing y dashboard.
6. Implementar Auth completo.
7. Implementar perfiles.
8. Implementar posts.
9. Implementar comunidades.
10. Implementar tienda básica.

## Regla de arquitectura

Cada módulo debe tener:

- Controller.
- Service.
- DTOs.
- Validaciones.
- Permisos por rol.
- Pruebas mínimas.

