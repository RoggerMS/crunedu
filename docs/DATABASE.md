# Base de datos

El modelo principal está en:

```txt
packages/database/prisma/schema.prisma
```

## Grupos de tablas

1. Estructura académica: `universities`, `faculties`, `careers`.
2. Usuarios y perfiles: `users`, `profiles`, tokens de verificación y recuperación.
3. Comunidades: `communities`, `community_members`.
4. Contenido: `posts`, `questions`, `answers`, `documents`.
5. Etiquetas: `tags`, `post_tags`, `question_tags`, `document_tags`.
6. Interacciones: `comments`, `reactions`, `saved_posts`.
7. Tienda básica: `products`, `product_categories`, `product_images`, `product_favorites`, `product_inquiries`.
8. Moderación: `reports`, `moderation_logs`.
9. Notificaciones: `notifications`.

## Regla importante de reportes

La tabla `reports` tiene campos opcionales para varias entidades. El backend debe validar que un reporte apunte solo a una entidad a la vez.

## Dinero

Los precios usan `Decimal @db.Decimal(10, 2)`, no `Float`.

## Límites no controlados por Prisma

- Máximo 6 imágenes por producto.
- Tamaño máximo de archivos.
- Tipos de archivo permitidos.
- Regla exacta de reportes graves.

Eso se valida en backend.
