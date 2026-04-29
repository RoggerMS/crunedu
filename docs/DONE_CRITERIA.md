# DONE CRITERIA (MVP)

Este documento define los criterios mínimos de “hecho” por módulo para evitar entregas incompletas y asegurar una experiencia útil para estudiantes.

## Criterios obligatorios por módulo

Aplican a: **landing**, **feed**, **comunidades**, **marketplace** y **auth**.

Cada módulo se considera completo solo si cumple todos los puntos:

1. **Flujo completo funcional**
   - El recorrido principal del usuario funciona de inicio a fin, sin pasos rotos.
   - No depende de datos mock en los caminos críticos del MVP.

2. **Mensajes claros de error y éxito**
   - El usuario recibe mensajes comprensibles cuando una acción falla.
   - El usuario recibe confirmación visible cuando una acción se completa correctamente.

3. **Mobile usable**
   - Las pantallas clave son utilizables en móvil (lectura, navegación, formularios y acciones principales).
   - No hay bloqueos críticos de interacción en tamaños de pantalla pequeños.

4. **Tiempos de carga aceptables**
   - Las vistas principales cargan en tiempos razonables para uso real.
   - Se muestran estados de carga cuando corresponde, evitando pantallas en blanco o confusas.

5. **Validación mínima de seguridad**
   - Inputs básicos validados (campos requeridos, formato mínimo, límites razonables).
   - Rutas protegidas correctamente cuando el módulo lo requiere (por ejemplo, acciones autenticadas).
   - No se exponen datos sensibles al usuario final.

---

## Checklist final obligatorio antes de merge

Debe completarse y registrarse antes de aprobar cualquier PR del MVP:

- [ ] **Lint** ejecutado y sin errores bloqueantes.
- [ ] **Build** ejecutado y exitoso.
- [ ] **Typecheck** ejecutado y exitoso.
- [ ] **Revisión UX** de flujos principales y estados (vacío, carga, error, éxito).
- [ ] **Pruebas manuales clave** realizadas en escenarios críticos del módulo.

---

## Criterio de calidad: “no parece demo”

Una entrega del MVP **no se aprueba** si da apariencia de demo técnica.

Criterios mínimos:

- [ ] No hay textos placeholder (ej.: “Lorem ipsum”, “TODO”, “Coming soon”) en vistas visibles al usuario final.
- [ ] No hay bloques técnicos visibles al usuario final (trazas, JSON crudo, mensajes internos de debug, nombres de variables).

Si cualquiera de estos puntos falla, la tarea debe volver a ajuste antes de merge.
