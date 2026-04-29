# CrunEdu

**CrunEdu** es una base de proyecto para una red social educativa universitaria, preparada para desarrollo local con Docker.

> Eslogan provisional: **Apuntes, dudas y comunidad universitaria en un solo lugar.**

La primera comunidad piloto será La Cantuta, pero la marca y arquitectura no dependen de una universidad específica.

## Qué incluye esta base

- Monorepo con npm workspaces.
- `apps/web`: Next.js + React + TypeScript + Tailwind CSS.
- `apps/api`: NestJS + TypeScript.
- `packages/database`: Prisma + PostgreSQL.
- `packages/shared`: constantes y tipos compartidos.
- `packages/ui`: componentes UI compartidos iniciales.
- Docker Compose con web, api, PostgreSQL, Redis, MinIO y Mailhog.
- Schema Prisma adaptado al MVP de red social + tienda básica.
- Documentación en `docs/` para que otro ingeniero entienda el mapa del proyecto.

## Requisitos

- Windows 11.
- Docker Desktop abierto.
- Node.js 20 o superior si quieres ejecutar comandos fuera de Docker.
- VS Code recomendado.

## Inicio rápido con Docker

```powershell
copy .env.example .env
docker compose up -d --build
```

Luego abre:

- Web: http://localhost:3000
- API health: http://localhost:4000/api/health
- MinIO Console: http://localhost:9001
- Mailhog: http://localhost:8025

Credenciales locales de MinIO:

- Usuario: `crunedu_minio`
- Contraseña: `crunedu_minio_password`

## Base de datos

Cuando los contenedores estén levantados, ejecuta la migración:

```powershell
docker compose exec api npm run db:migrate -- --name init
```

Después carga datos iniciales:

```powershell
docker compose exec api npm run db:seed
```

Admin local creado por el seed:

- Email: `admin@crunedu.local`
- Password: `CrunEdu123!`

## Comandos útiles

```powershell
docker compose ps
docker compose logs -f
docker compose down
```

## Nota importante sobre PostgreSQL en Docker

Si ves este error en el contenedor de API:

- `PrismaClientInitializationError: Can't reach database server at localhost:5432`

normalmente significa que la API dentro de Docker está intentando conectarse a `localhost` en lugar del servicio `postgres`.

Esta base ya separa ambas URLs:

- `DOCKER_DATABASE_URL`: conexión interna entre contenedores (`postgres:5432`).
- `DATABASE_URL`: conexión desde tu host (Windows) a PostgreSQL (`localhost:5432`).

Si cambias variables en `.env`, mantén esa separación para evitar el error `P1001` en Docker.


## Convención de naming funcional (UI)

- En esta iteración, el término único en UI y producto es **Comunidades**.
- El término **clubs** queda reservado para un experimento futuro y no debe mezclarse en textos visibles actuales.
- Referencia operativa: `docs/NAMING_COMUNIDADES.md`.

## Qué NO incluye el MVP

- Dominio.
- Hosting.
- Producción.
- Pagos automáticos.
- Vendedores externos.
- Carrito avanzado.
- Chat privado.
- App móvil.
- Inteligencia artificial.
- Búsqueda avanzada en documentos.

## Estructura

```txt
crunedu/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── database/
│   ├── shared/
│   └── ui/
├── docker/
├── docs/
├── docker-compose.yml
├── package.json
└── .env.example
```

## Siguiente etapa

La siguiente fase real es implementar módulos uno por uno siguiendo `docs/ROADMAP.md`.
