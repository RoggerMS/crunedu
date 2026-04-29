# PRODUCT_KPIS

## Objetivo
Definir métricas mínimas de producto para el MVP de CrunEdu y un esquema de seguimiento de 30/60/90 días con alertas tempranas.

---

## Horizonte 30/60/90 días

### Día 30 (adopción inicial)
- **DAU/WAU (stickiness):** ≥ **0.18**
- **Retención:** D1 ≥ **22%**, D7 ≥ **10%**, D30: línea base inicial (medir)
- **Participación activa (% usuarios que publican, comentan o responden al menos 1 vez/semana):** ≥ **12%**
- **Tiempo medio de carga del feed (P95):** ≤ **2.5s**
- **Reportes por 1,000 publicaciones:** ≤ **25**

### Día 60 (tracción)
- **DAU/WAU:** ≥ **0.24**
- **Retención:** D1 ≥ **28%**, D7 ≥ **14%**, D30 ≥ **7%**
- **Participación activa:** ≥ **18%**
- **Tiempo medio de carga del feed (P95):** ≤ **2.0s**
- **Reportes por 1,000 publicaciones:** ≤ **18**

### Día 90 (consolidación MVP)
- **DAU/WAU:** ≥ **0.30**
- **Retención:** D1 ≥ **35%**, D7 ≥ **18%**, D30 ≥ **10%**
- **Participación activa:** ≥ **25%**
- **Tiempo medio de carga del feed (P95):** ≤ **1.5s**
- **Reportes por 1,000 publicaciones:** ≤ **12**

---

## Definición de métricas

### 1) DAU/WAU
- **DAU:** usuarios únicos activos por día.
- **WAU:** usuarios únicos activos en los últimos 7 días.
- **Fórmula stickiness:** `DAU / WAU`.

### 2) Retención D1 / D7 / D30
- Cohorte por fecha de registro (o primera actividad).
- **D1:** regresan al día siguiente.
- **D7:** regresan al séptimo día.
- **D30:** regresan al día 30.

### 3) % de usuarios que publican, comentan o responden
- Numerador: usuarios únicos con al menos una acción (post, comentario o respuesta) en 7 días.
- Denominador: WAU del mismo periodo.
- Fórmula: `usuarios_participativos / WAU * 100`.

### 4) Tiempo medio de carga del feed
- Medición de `GET /api/posts` desde cliente y API.
- Reportar **promedio** y **P95** por semana.
- KPI operativo principal: **P95**.

### 5) Reportes por 1,000 publicaciones
- Fórmula: `(reportes_totales / publicaciones_totales) * 1000`.
- Monitorea calidad de contenido y necesidad de moderación.

---

## Umbrales de alerta (mínimos)

### Alertas de plataforma
- **Error rate API > 2%** (5xx + timeouts) durante 15 minutos.
- **P95 de `GET /api/posts` > 3.0s** durante 15 minutos.
- **Disponibilidad API < 99.5%** semanal.

### Alertas de producto
- **DAU/WAU < 0.15** por 2 semanas consecutivas.
- **Retención D7 cae > 20%** respecto al promedio de las 4 semanas previas.
- **Participación activa < 10%** semanal.
- **Reportes > 30 por 1,000 publicaciones** semanal.

### Niveles sugeridos
- **Warning:** se supera umbral 1 vez en la semana.
- **Critical:** se supera umbral 2 semanas consecutivas o 3+ veces en una semana.

---

## Definition of Done por módulo

Cada módulo se considera completado si cumple los cuatro ejes:

1. **Funcional**
   - Endpoints/flujo UI operativos según alcance del módulo.
   - Casos felices y errores principales cubiertos.

2. **Rendimiento**
   - P95 de endpoints críticos dentro de objetivo vigente (30/60/90 días).
   - Sin degradación > 15% frente a baseline previo al release.

3. **Seguridad**
   - Endpoints de escritura protegidos con JWT/autorización correspondiente.
   - Validación de input en DTOs.
   - Sin exposición de datos sensibles en respuestas/logs.

4. **Observabilidad**
   - Logs estructurados en operaciones críticas.
   - Métricas mínimas instrumentadas (latencia, errores, volumen).
   - Alertas configuradas para umbrales definidos.

---

## Revisión semanal (tablero simple)

### Frecuencia
- Revisión **semanal** (30 minutos) con equipo de producto + técnico.

### Tablero mínimo (puede ser Notion/Google Sheet/Metabase)
- DAU, WAU y ratio DAU/WAU.
- Retención D1/D7/D30 por cohorte.
- % de participación activa (post/comentario/respuesta).
- Latencia feed (promedio y P95).
- Error rate API y disponibilidad.
- Reportes por 1,000 publicaciones.
- Incidentes abiertos/cerrados de la semana.

### Dinámica de revisión
1. Comparar valor actual vs meta 30/60/90.
2. Identificar métricas en warning/critical.
3. Definir 1–3 acciones concretas con responsable y fecha.
4. Registrar decisiones y seguimiento en la siguiente semana.

---

## Notas
- Los umbrales son iniciales para etapa MVP y deben recalibrarse con datos reales.
- Priorizar estabilidad de `auth`, `communities` y `posts/feed` en la primera fase.
