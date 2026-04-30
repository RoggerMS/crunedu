# GO LIVE CHECKLIST

## Bloque técnico

- [ ] **Build/Lint/Typecheck OK**
  - Ejecutar build completo del monorepo sin errores.
  - Ejecutar lint en web, api y paquetes compartidos sin errores críticos.
  - Ejecutar typecheck en todo el workspace sin errores.
- [ ] **Endpoints críticos validados**
  - Validar `GET /api/health` (salud del backend).
  - Validar autenticación: `POST /api/auth/register` y `POST /api/auth/login`.
  - Validar comunidades: `GET /api/communities` devuelve datos reales.
  - Validar publicaciones: `GET /api/posts` y `POST /api/posts` (JWT requerido).
- [ ] **Errores conocidos priorizados**
  - Registrar bugs abiertos con severidad (Alta/Media/Baja).
  - Confirmar dueño responsable y fecha objetivo por cada bug crítico.
  - Bloquear salida a piloto si existe bug crítico sin mitigación.

## Bloque producto

- [ ] **Onboarding funcional**
  - Registro y login completables en flujo normal.
  - Mensajes de error claros y en español en casos esperados.
  - Usuario nuevo puede llegar a comunidades/publicaciones sin pasos ambiguos.
- [ ] **Publicación/comentario/follow sin fricción**
  - Crear publicación funciona desde cuenta autenticada.
  - Interacción base de comentario disponible y verificable (si el módulo está habilitado).
  - Flujo de follow/unirse a comunidad no presenta bloqueos UX en escenarios principales.
- [ ] **Legal visible en landing**
  - Términos y condiciones visibles en landing.
  - Política de privacidad visible en landing.
  - Se aclara que CrunEdu es una plataforma independiente y no oficial de la universidad.

## Bloque operación

- [ ] **Monitoreo activo**
  - Salud de API y web con chequeos periódicos.
  - Logs accesibles para diagnóstico rápido.
  - Alertas mínimas configuradas para caídas de servicios críticos.
- [ ] **Procedimiento de incidentes**
  - Runbook breve para incidentes (detección, escalamiento, resolución, cierre).
  - Canales y responsables definidos para soporte técnico.
  - Tiempo objetivo de respuesta inicial (SLA interno) documentado.
- [ ] **Cuenta admin validada**
  - Credenciales admin operativas y probadas.
  - Accesos administrativos mínimos verificados.
  - Rotación/almacenamiento seguro de credenciales documentado.

## Criterios de salida

### Listo para piloto

Se considera **listo para piloto** cuando:

1. Todos los checks técnicos y de operación críticos están en estado completado.
2. No hay bugs críticos abiertos sin mitigación.
3. El flujo principal (registro, login, ver comunidades, crear publicación) funciona de extremo a extremo.
4. Legal base visible y consistente en landing.
5. Existe plan de respuesta a incidentes y responsables activos.

### Listo para apertura mayor

Se considera **listo para apertura mayor** cuando:

1. El piloto se ejecutó con feedback real y acciones de mejora cerradas.
2. Métricas mínimas de estabilidad cumplen objetivo (uptime, errores 5xx, tiempos de respuesta).
3. La experiencia de publicación/interacción se mantiene estable con mayor carga.
4. Procesos operativos (monitoreo, soporte, incidentes) demuestran repetibilidad.
5. Riesgos legales, técnicos y de producto están documentados con plan de mitigación vigente.
