# Plan de evolución multiuniversidad (sin romper La Cantuta)

## Objetivo

Definir una ruta gradual para que CrunEdu soporte múltiples universidades y campus, manteniendo a **La Cantuta** como primer entorno estable y sin cambios destructivos en base de datos.

## 1) Revisión del modelo de datos actual

Estado actual relevante en `schema.prisma`:

- Ya existe `University` con `slug` único.
- `Faculty` depende de `University` (`universityId`).
- `Career` depende de `Faculty` (`facultyId`).
- `Profile` ya tiene relación opcional con `University`, `Faculty` y `Career`.

Conclusión:

- La base **ya tiene un núcleo multiuniversidad** para estructura académica y perfil.
- Para no romper lo existente, no se proponen cambios destructivos ni renombres de tablas actuales.
- El siguiente paso debe enfocarse en **aislamiento de configuración y contenido** por universidad/campus, no en rediseñar lo que ya funciona.

## 2) Aislamiento por campus y comunidad principal

### Problema a resolver

Hoy la configuración global (branding, textos institucionales, features visibles) puede terminar mezclando contextos cuando haya más de una universidad.

### Propuesta de diseño objetivo (incremental)

Agregar capas de configuración sin tocar flujos críticos actuales:

1. **Tenant universitario lógico** (por `university.slug`).
2. **Campus** como subdivisión opcional dentro de una universidad.
3. **Comunidad principal por campus** para enrutar feed inicial y navegación sugerida.

### Modelo sugerido (fase futura, no destructiva)

Nuevas entidades aditivas:

- `Campus`:
  - `id`, `universityId`, `name`, `slug`, `isDefault`, timestamps.
- `CampusConfig`:
  - `campusId`, `branding`, `contactInfo`, `legalCopy`, `isActive`.
- `CommunityScope` (o campo aditivo en comunidad):
  - vincular comunidad a `universityId` y opcionalmente `campusId`.

Reglas de compatibilidad:

- Si no hay `campusId`, se usa el campus por defecto (`isDefault=true`) de la universidad.
- Si una comunidad no tiene scope explícito, se considera global para la universidad de La Cantuta en transición.

## 3) Feature flags para activación gradual

### Objetivo

Permitir encender funcionalidades por entorno universitario sin bifurcar código ni hacer despliegues riesgosos.

### Flags recomendadas (MVP+)

- `ff_multi_university_routing`
- `ff_campus_context`
- `ff_feed_scoped_by_campus`
- `ff_guides_scoped_by_university`
- `ff_store_scoped_by_university`

### Niveles de evaluación

1. Global (plataforma).
2. Universidad (`university.slug`).
3. Campus (`campus.slug`).

### Resolución de flags

Prioridad sugerida: `campus > universidad > global`.

Fallback seguro:

- Si no existe configuración, usar `false` para flags nuevas y comportamiento actual para módulos ya activos en La Cantuta.

## 4) Arquitectura objetivo a mediano plazo

### Principios

- Mantener monorepo actual (web/api/packages).
- Evitar microservicios prematuros.
- Aplicar aislamiento lógico por tenant, no físico por base de datos en esta etapa.

### Objetivo de módulos

- **Context Resolver** (API): determina `university/campus` por request.
- **Tenant Config Service** (API): expone branding, feature flags y defaults por contexto.
- **Scoped Repositories**: queries con filtros por `universityId/campusId` cuando aplique.
- **Frontend Context Provider**: conserva el contexto activo para navegación/feed.

### Contratos base propuestos

- Header opcional: `X-Crunedu-University` y en fases posteriores `X-Crunedu-Campus`.
- Resolución principal pública: subruta o slug (`/u/:universitySlug/...`) cuando se active el flag de routing.
- Compatibilidad temporal: rutas actuales siguen funcionando para La Cantuta durante transición.

## 5) Plan de migración gradual (no destructivo)

### Fase A — Diagnóstico y contratos (sin migraciones)

- Inventariar endpoints que leen/escriben contenido social.
- Definir cuáles requieren scope universitario/campus.
- Documentar defaults para La Cantuta.

### Fase B — Esquema aditivo

- Crear tablas nuevas (`Campus`, `CampusConfig`, tabla de flags o config JSON tipado).
- Agregar columnas opcionales de scope en tablas de contenido donde sea necesario.
- No eliminar columnas existentes ni cambiar constraints críticos en esta fase.

### Fase C — Backfill compatible

- Cargar La Cantuta como `University` canónica (si ya existe, validar consistencia de slug).
- Crear campus default La Cantuta.
- Asociar datos existentes al contexto default mediante script idempotente.

### Fase D — Lectura dual controlada por flag

- Servicios leen scope nuevo si flag activo.
- Si flag inactivo, mantienen comportamiento actual.
- Métricas y logs para detectar diferencias de resultados.

### Fase E — Escritura con scope

- Activar creación de nuevos posts/recursos con `universityId/campusId` según contexto resuelto.
- Validar que usuarios sin contexto explícito caigan al default de La Cantuta.

### Fase F — Activación por universidad

- Encender flags por universidad piloto adicional.
- Monitorear errores, latencia y consistencia de feed.
- Expandir progresivamente.

## 6) Riesgos y mitigaciones

- **Riesgo:** fuga de datos entre universidades por queries sin filtro.
  - **Mitigación:** capa de repositorio con helpers obligatorios de scope + tests de contrato.
- **Riesgo:** defaults ambiguos en usuarios antiguos.
  - **Mitigación:** script de backfill idempotente + regla explícita de fallback a campus default.
- **Riesgo:** complejidad de flags.
  - **Mitigación:** catálogo de flags pequeño, documentación de owner y fecha de retiro.

## 7) Checklist de implementación segura

- [ ] No romper `GET /api/communities` existente.
- [ ] No romper auth JWT actual.
- [ ] Mantener seed compatible.
- [ ] Ejecutar pruebas de contrato/regresión antes y después de cada fase.
- [ ] Registrar decisiones de arquitectura por fase.

## 8) Resultado esperado

Con esta ruta, CrunEdu puede expandirse a múltiples universidades de forma incremental, manteniendo estabilidad en La Cantuta, sin migraciones destructivas y con control de activación por feature flags.
