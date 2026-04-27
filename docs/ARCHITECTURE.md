# Arquitectura de CrunEdu

## Objetivo

CrunEdu es una red social educativa universitaria. El MVP debe permitir comunidad, publicaciones, preguntas, apuntes, tienda básica, reportes y moderación.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | NestJS, TypeScript |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Cache / colas | Redis |
| Archivos locales | MinIO |
| Correo local | Mailhog |
| Desarrollo local | Docker Compose |

## Decisiones importantes

- El código técnico usa inglés.
- La interfaz visible usa español.
- No hay dominio todavía.
- Todo corre en `localhost`.
- La tienda es administrada por CrunEdu.
- No hay pagos automáticos ni vendedores externos.

## Puertos locales

| Servicio | URL |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:4000/api |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |
| MinIO API | http://localhost:9000 |
| MinIO Console | http://localhost:9001 |
| Mailhog | http://localhost:8025 |
