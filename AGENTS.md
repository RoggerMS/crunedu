# AGENTS.md — Reglas permanentes del proyecto CrunEdu

## 1) Contexto del proyecto
CrunEdu es una plataforma educativa enfocada en entregar un MVP funcional, mantenible y validable rápidamente.
El objetivo principal es iterar con cambios pequeños, seguros y trazables, priorizando estabilidad, claridad y velocidad de ejecución.

## 2) Stack técnico
> Mantener este bloque actualizado cuando el stack evolucione.

- Frontend: TypeScript + framework web del repositorio.
- Backend/API: Node.js + TypeScript (según estructura actual del repo).
- Base de datos: Prisma ORM + motor configurado en el proyecto.
- Testing/verificación: comandos locales del repositorio (lint, typecheck, tests, build).

## 3) Reglas obligatorias
1. **No modificar código funcional sin requerimiento explícito.**
2. **No implementar funcionalidades fuera del MVP.**
3. **No cambiar `schema.prisma` salvo necesidad real y justificada.**
4. **Código técnico siempre en inglés** (nombres de variables, funciones, clases, commits técnicos, etc.).
5. **Interfaz visible al usuario en español** (labels, textos, mensajes UX).
6. Trabajar con cambios pequeños, atómicos y fáciles de revertir.
7. Documentar cada cambio realizado de forma breve y verificable.
8. Antes de proponer refactors grandes, dividir en fases cortas con validación intermedia.

## 4) Comandos seguros
Ejecutar preferentemente comandos de lectura, validación y calidad:

- `git status`
- `git diff`
- `git add -p`
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npx prisma validate`
- `npx prisma format` (solo si aplica y sin cambiar lógica)

> Usar equivalentes (`pnpm`, `yarn`, etc.) únicamente si el repositorio ya los usa.

## 5) Comandos prohibidos
- `docker compose down -v` (**prohibido**).
- Comandos destructivos sin aprobación explícita del responsable del proyecto:
  - `rm -rf` sobre carpetas del proyecto
  - `git reset --hard`
  - `git clean -fd`
  - `truncate`, `drop`, o reseteos de datos sin respaldo
- Migraciones o regeneraciones masivas no justificadas para el objetivo actual.

## 6) Cómo verificar web
Para cambios web/UI, seguir esta secuencia mínima:

1. Levantar entorno local con el comando estándar del repositorio.
2. Validar que la página objetivo carga sin errores en consola.
3. Recorrer flujo funcional afectado (happy path + caso límite básico).
4. Verificar textos visibles en español.
5. Revisar responsive básico (mobile y desktop).
6. Adjuntar evidencia breve (captura/log) cuando corresponda.

## 7) Cómo verificar API
Para cambios de backend/API, seguir esta secuencia mínima:

1. Ejecutar lint + typecheck.
2. Ejecutar tests unitarios/integración del módulo afectado.
3. Probar endpoint con datos válidos e inválidos.
4. Verificar códigos HTTP, shape de respuesta y mensajes de error.
5. Confirmar que no se rompe compatibilidad del contrato existente (MVP).
6. Registrar comandos usados y resultado.

## 8) Cómo trabajar por módulos pequeños
- Dividir tareas grandes en submódulos de impacto acotado.
- Implementar un cambio por vez, validar y recién después continuar.
- Evitar mezclar en un mismo commit: refactor + feature + fix.
- Si aparece alcance nuevo, documentar y posponer fuera del MVP.
- Priorizar PRs cortos, con contexto claro y checklist de validación.

## 9) Alcance MVP (restricción permanente)
- Queda explícitamente prohibido agregar funcionalidades “nice-to-have” fuera del MVP.
- Cualquier ampliación de alcance requiere justificación y aprobación previa.

## 10) Política de base de datos
- `schema.prisma` es sensible: solo cambiar ante necesidad real del requerimiento.
- Si se modifica, debe incluir:
  - justificación concreta,
  - impacto esperado,
  - plan de migración/rollback,
  - validación de compatibilidad con el MVP.

## 11) Idioma de desarrollo y producto
- **Desarrollo interno/técnico:** inglés.
- **Producto visible al usuario:** español.

## 12) Definición de terminado (DoD) mínima
Un cambio se considera completo cuando:
- cumple alcance MVP,
- respeta estas reglas,
- pasa verificaciones aplicables (web o API),
- queda documentado de manera breve (qué cambió, cómo se validó, riesgos).
