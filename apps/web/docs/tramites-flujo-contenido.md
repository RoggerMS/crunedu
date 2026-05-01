# Trámites: tipos, plantillas, estado y alertas

## Objetivo
Mejorar el módulo `Trámites` para que el estudiante pueda publicar y consultar información de procedimientos sin salir de la sección.

## Cambios implementados

1. **Tipos de contenido**
   - Guía oficial.
   - Experiencia estudiantil.
   - Pregunta de trámite.

2. **Flujo de publicación en la misma sección**
   - Formulario enriquecido en `/app/tramites` para publicar desde la vista actual.
   - Mensaje de confirmación inmediato en la misma pantalla.

3. **Plantillas simples por trámite**
   - Matrícula.
   - Carné.
   - Comedor.
   - Constancias.

4. **Estado del trámite**
   - Informativo.
   - Vigente.
   - Cambiado.

5. **Alertas de cambios recientes**
   - Bloque visual de alertas por trámite con referencia temporal.

## Alcance actual
- Implementación en frontend para MVP (UI + flujo local).
- No se modificó esquema Prisma ni contratos de API.
