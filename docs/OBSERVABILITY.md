# Observabilidad operativa - CrunEdu API

## Logging estructurado

Se agregó logging JSON por request en API con:

- `requestId` (header `x-request-id` o UUID generado)
- `userId` (si existe usuario autenticado)
- `endpoint` (`METHOD route`)
- `latencyMs`
- `statusCode`

Implementación: `ObservabilityInterceptor` global.

## Métricas técnicas

Endpoint operativo:

- `GET /api/observability/metrics`

Campos por endpoint:

- `p95LatencyMs`
- `errorRate`
- `throughput` (contador acumulado del proceso)

## Métricas de producto

Incluidas en el mismo endpoint:

- `postsCreated`
- `commentsCreated`
- `activeSessions` (ventana móvil de 30 minutos)
- `retentionByCohort` (cohorte mensual `YYYY-MM` por registro)

## Dashboard operativo recomendado

Crear dashboard (Grafana / Datadog / New Relic) con paneles:

1. **API p95 latency por endpoint**
2. **API error rate por endpoint**
3. **API throughput por endpoint**
4. **Posts creados por hora**
5. **Comentarios creados por hora**
6. **Sesiones activas**
7. **Retención por cohorte (tabla)**

## Alertas sugeridas

1. **Alta latencia**: p95 > 800ms por 10 minutos.
2. **Error rate elevado**: > 5% por 5 minutos.
3. **Caída parcial API**: throughput de endpoints críticos cae > 70% frente a media de 1h.
4. **Anomalía de spam**: creación de posts/comentarios > 3x baseline de 24h.

## Notas de implementación

- Métricas en memoria del proceso (MVP).
- En despliegues con múltiples réplicas, agregar agregación centralizada (Prometheus/OpenTelemetry) en fase posterior.
