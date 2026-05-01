# MOMENTOS_SPEC — CrunEdu MVP

## 1) Objetivo

Definir una primera versión de **Momentos** para destacar contenido universitario relevante sin romper el flujo actual de comunidades/posts.

`Momento` = una pieza priorizada y visible (día/semana) que ayuda a estudiantes a enterarse, actuar o debatir con contexto.

---

## 2) Capas funcionales

## 2.1 Capa automática (sistema)

El sistema identifica candidatos de alto valor desde contenido existente:

- publicación
- pregunta
- debate
- trámite

La selección automática prioriza:

- recencia
- interacción
- relevancia comunitaria
- urgencia temporal (especialmente trámites)

Resultado esperado:

- `Momento del día`
- `Momento de la semana`

## 2.2 Capa participativa (usuarios)

Los usuarios pueden **proponer un momento** agregando evidencia/contexto.

Propuesta mínima de usuario:

- referencia al contenido (`postId` o entidad equivalente)
- motivo breve
- evidencia opcional (fuente interna o enlace externo confiable)
- contexto útil para estudiantes

La propuesta no se publica automáticamente como destacada: pasa por ranking + reglas de moderación.

---

## 3) Tipos de “momento”

Tipos iniciales para MVP:

1. **noticia académica**
   - Cambios de calendario, comunicados de facultad, avisos académicos relevantes.
2. **debate destacado**
   - Discusión con participación útil, argumentos claros y valor informativo.
3. **trámite urgente**
   - Procedimientos con fecha límite o impacto inmediato (matrícula, constancias, etc.).
4. **publicación destacada**
   - Post con alto valor práctico para la comunidad.

Sugerencia técnica:

- Enum `MomentType` con valores:
  - `ACADEMIC_NEWS`
  - `FEATURED_DEBATE`
  - `URGENT_PROCEDURE`
  - `FEATURED_POST`

---

## 4) Ranking inicial (momento del día/semana)

## 4.1 Señales base

Puntaje por candidato (`momentScore`) en escala abierta:

- `interactionScore` (0–40)
  - votos de relevancia
  - comentarios de contexto
- `freshnessScore` (0–25)
  - contenido más reciente puntúa más
- `urgencyScore` (0–25)
  - mayor para trámites con vencimiento cercano
- `trustScore` (0–10)
  - señal por historial de reportes/revisiones

Fórmula inicial sugerida:

```text
momentScore = interactionScore + freshnessScore + urgencyScore + trustScore
```

## 4.2 Ajustes por horizonte

- **Momento del día**:
  - ventana principal: últimas 48 horas
  - sesgo alto a recencia y urgencia
- **Momento de la semana**:
  - ventana principal: últimos 7 días
  - sesgo balanceado entre interacción y utilidad acumulada

## 4.3 Reglas de desempate

En empates:

1. mayor `urgencyScore`
2. mayor `interactionScore`
3. más reciente (`createdAt`)

---

## 5) Acciones de usuario

## 5.1 Votar relevancia

Acción: `votar relevancia` sobre un candidato a momento.

Requisitos MVP:

- 1 voto por usuario por candidato
- permitir actualizar voto (ej. subir o retirar)
- registrar timestamp del último voto

Efecto:

- impacta `interactionScore`
- se recalcula ranking (inmediato o por job corto)

## 5.2 Comentar contexto

Acción: `comentar contexto` para ampliar información.

Objetivo:

- agregar detalles prácticos
- aclarar alcance
- evitar interpretaciones erróneas

Requisitos MVP:

- comentarios cortos y legibles
- autor + fecha visibles
- editable por autor por ventana corta (opcional)

Efecto:

- aumenta calidad contextual
- puede sumar al `interactionScore` con peso menor que voto

---

## 6) Moderación especial anti-desinformación

## 6.1 Principios

- priorizar seguridad informativa en trámites y avisos críticos
- no amplificar contenido dudoso sin revisión
- mantener trazabilidad de decisiones

## 6.2 Reglas mínimas

1. **Etiquetas de estado** para cada candidato:
   - `PENDING_REVIEW`
   - `VERIFIED`
   - `DISPUTED`
   - `REJECTED`
2. **Gate de visibilidad**:
   - contenido marcado `DISPUTED` no puede ser momento del día/semana
3. **Fuentes y evidencia**:
   - trámites urgentes deben incluir contexto verificable mínimo
4. **Escalamiento**:
   - múltiples reportes en ventana corta → revisión prioritaria
5. **Auditoría**:
   - registrar moderador, motivo y timestamp de acción

## 6.3 Señales automáticas de riesgo

Disparadores para revisión:

- cambios frecuentes del texto base
- muchos reportes en poco tiempo
- enlaces externos no confiables
- afirmaciones críticas sin evidencia/contexto

## 6.4 UX mínima recomendada

- badge visible: `Verificado`, `En revisión`, `En disputa`
- mensaje claro cuando un momento pierde visibilidad por disputa
- enlace a contexto/moderación resumido

---

## 7) Contrato funcional MVP (alto nivel)

Entidades mínimas conceptuales:

- `MomentCandidate`
- `MomentVote`
- `MomentContextComment`
- `MomentModerationLog`

Endpoints orientativos (no obligatorios en esta fase documental):

- `GET /api/moments?scope=daily|weekly`
- `POST /api/moments/proposals`
- `POST /api/moments/:id/votes`
- `POST /api/moments/:id/context-comments`
- `POST /api/moments/:id/moderation`

---

## 8) Fases sugeridas de implementación

1. **Fase 1**: lectura
   - calcular ranking básico y exponer momento del día/semana
2. **Fase 2**: participación
   - propuestas + votos + comentarios de contexto
3. **Fase 3**: moderación reforzada
   - estados, revisión, bloqueo de disputados
4. **Fase 4**: ajuste fino
   - calibrar pesos y anti-spam

---

## 9) Riesgos y mitigación

- **Riesgo**: brigading de votos.  
  **Mitigación**: rate limits, peso por antigüedad de cuenta, detección de patrones.

- **Riesgo**: viralizar desinformación de trámites.  
  **Mitigación**: estado `PENDING_REVIEW` por defecto en contenido sensible + gate de visibilidad.

- **Riesgo**: fatiga de moderación.  
  **Mitigación**: colas por prioridad (urgencia + reportes + alcance).

---

## 10) Criterio de éxito MVP

- Existe al menos 1 momento diario y 1 semanal con ranking reproducible.
- Usuarios pueden votar relevancia y comentar contexto.
- Moderación puede bloquear momentos dudosos antes de destacarlos.
- El sistema mejora descubrimiento sin romper comunidades/posts actuales.
