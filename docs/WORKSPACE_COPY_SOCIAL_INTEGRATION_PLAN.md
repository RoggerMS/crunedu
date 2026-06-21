# Integración social desde `workspace-copiar`

Alta: 2026-06-21

## Objetivo

Adaptar a la arquitectura actual de CrunEdu las mejores partes del feed, configuración, perfiles públicos y notificaciones de `workspace-copiar`.

## Alcance

- Mejorar el feed existente sin reemplazar su integración NestJS/PostgreSQL.
- Hacer navegables los autores y ofrecer perfil público para cada usuario.
- Separar configuración de cuenta, apariencia y preferencias locales.
- Implementar notificaciones reales, contador, ventana rápida y navegación al contenido relacionado.

## Fuera de alcance

- Preguntas
- Momentos
- Universidad
- Debates
- Tienda

## Estado

Implementación completada; pendiente verificación runtime local con Docker.

## Criterios de cierre

- El feed conserva todas sus funciones actuales y enlaza perfiles.
- `/app/perfil/[id]` muestra un perfil público real.
- La configuración permite editar el perfil y preferencias locales.
- El icono de notificaciones abre una ventana, permite marcar como leída y navegar al destino.
- Build web y build API completan sin errores nuevos.
