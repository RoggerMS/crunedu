# Runbook de incidentes - CrunEdu

## 1) Caída de API

### Señales
- Healthcheck falla.
- Error rate cercano a 100%.
- Throughput cae abruptamente.

### Pasos
1. Verificar `/api/health`.
2. Revisar logs estructurados buscando `statusCode=5xx`.
3. Identificar primer endpoint afectado y timestamp.
4. Reiniciar solo servicio API si corresponde.
5. Validar recuperación con healthcheck y endpoint crítico (`/api/communities`, `/api/posts`).

### Mitigación temporal
- Habilitar modo degradado en frontend (mensaje de mantenimiento).
- Limitar operaciones de escritura temporalmente.

---

## 2) Lentitud de base de datos

### Señales
- Aumento de `p95LatencyMs` en endpoints dependientes de DB.
- Timeouts en endpoints de lectura/escritura.

### Pasos
1. Confirmar endpoints con mayor p95.
2. Revisar carga y conexiones de PostgreSQL.
3. Revisar queries más frecuentes del endpoint afectado.
4. Activar caché caliente donde aplique.
5. Escalar recursos DB o reducir tráfico de escrituras temporalmente.

### Mitigación temporal
- Reducir límite de resultados en feeds.
- Priorizar endpoints críticos (auth, communities, posts GET).

---

## 3) Spam masivo (posts/comentarios)

### Señales
- Pico anómalo de `postsCreated` o `commentsCreated`.
- Reportes de usuarios por contenido repetitivo.

### Pasos
1. Confirmar pico en métricas de producto.
2. Identificar `userId` y patrones por endpoint.
3. Aplicar bloqueo temporal a cuentas involucradas.
4. Ajustar rate limits de posts/comentarios.
5. Coordinar moderación para limpieza de contenido.

### Mitigación temporal
- Endurecer reglas mínimas de contenido.
- Reducir cuota por minuto en creación de posts/comentarios.

---

## Checklist de cierre
- Incidente documentado con hora de inicio/fin.
- Causa raíz preliminar registrada.
- Acciones correctivas creadas como tareas.
- Comunicación de cierre al equipo.
