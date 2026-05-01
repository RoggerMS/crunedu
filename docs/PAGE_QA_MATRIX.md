# PAGE_QA_MATRIX

Matriz de QA funcional por página para ejecutar en **cada release local antes de merge**.

## Uso de la matriz

- Ejecutar esta matriz completa en entorno local antes de cada merge.
- Registrar resultado por fila: `PASS` o `FAIL`.
- Si falla un caso de severidad **bloqueante**, no se debe hacer merge.
- Si falla un caso de severidad **media** o **baja**, documentar riesgo y definir plan de corrección.

## Matriz QA por página

| Página | Objetivo funcional | Acciones permitidas | Acciones que **NO** deben redirigir al feed por error | Estados de carga / error / vacío | Resultado esperado | Severidad |
|---|---|---|---|---|---|---|
| Landing pública | Presentar CrunEdu, su propuesta para estudiantes y acceso claro a registro/login. | Ver información pública, navegar a login/registro, explorar enlaces públicos habilitados. | Ver secciones informativas, abrir CTA de registro/login, cambiar entre bloques de contenido públicos. | **Carga:** skeleton/placeholder visible. **Error:** mensaje claro y opción de reintento si hay datos remotos. **Vacío:** fallback informativo cuando no haya contenido dinámico. | El usuario no autenticado entiende el propósito de CrunEdu y puede iniciar flujo de acceso sin redirecciones inesperadas al feed. | Media |
| Feed (`/app`) | Mostrar publicaciones reales y permitir interacción base del feed según sesión. | Ver listado de posts, refrescar feed, navegar a detalle/perfil/comunidad relacionado, crear post si está autenticado. | Cambiar filtros/secciones del feed, abrir formulario de publicación, cancelar creación de post, navegar dentro del AppShell. | **Carga:** indicador al cargar posts. **Error:** mensaje `Error al cargar publicaciones` + reintento. **Vacío:** `No hay publicaciones aún` con CTA útil. | El feed carga datos reales, respeta autenticación para publicar y mantiene navegación estable dentro de `/app`. | Bloqueante |
| Comunidades | Listar comunidades reales y permitir entrada a cada comunidad sin romper navegación. | Ver comunidades, entrar a comunidad, volver al listado, consultar contenido asociado. | Abrir una tarjeta de comunidad, volver con botón del navegador, recargar página de comunidades, paginar/filtrar (si aplica). | **Carga:** indicador de carga de comunidades. **Error:** `Error al cargar las comunidades`. **Vacío:** mensaje claro sin datos mock. | Se muestran comunidades reales (ej. Cachimbos, Apuntes, Trámites, General) y la navegación funciona sin saltos al feed por error. | Bloqueante |
| Preguntas | Permitir consultar y crear preguntas (según permisos/autenticación) para interacción académica. | Ver preguntas, abrir detalle, crear pregunta autenticado, responder (si ya está habilitado en MVP). | Abrir formulario de pregunta, validar campos, cancelar edición, volver a listado de preguntas. | **Carga:** estado de carga en lista/form. **Error:** validaciones y error de API claros. **Vacío:** mensaje tipo `No hay preguntas aún`. | El módulo de preguntas conserva contexto, no pierde navegación y evita redirecciones incorrectas al feed. | Media |
| Apuntes | Mostrar apuntes/documentos permitidos y facilitar su consulta dentro de reglas MVP. | Ver listado, abrir detalle, buscar/filtrar básico (si existe), descargar/visualizar si está habilitado. | Abrir un apunte, volver al listado, cambiar filtros, abrir vista previa. | **Carga:** indicador mientras lista/preview carga. **Error:** mensaje de fallo de carga o acceso. **Vacío:** mensaje de no disponibilidad de apuntes. | El usuario puede consultar apuntes sin bloqueos ni redirecciones accidentales al feed. | Media |
| Trámites | Guiar al estudiante en procedimientos universitarios con información clara y accionable. | Ver listado de trámites, abrir detalle, revisar pasos/requisitos, usar enlaces de apoyo. | Abrir detalle de trámite, navegar entre secciones del trámite, regresar al índice. | **Carga:** estado visible en listado/detalle. **Error:** mensaje claro de contenido no disponible. **Vacío:** mensaje de trámites aún no publicados. | El contenido de trámites se consulta de forma estable y sin enviar al usuario al feed por error. | Media |
| Momentos | Mostrar contenido social universitario ligero para reforzar comunidad estudiantil. | Ver momentos, abrir detalle/galería (si aplica), navegar entre publicaciones del módulo. | Abrir momento, cerrar modal/detalle, cambiar entre tabs del módulo, volver al listado. | **Carga:** placeholder de tarjetas. **Error:** mensaje de carga fallida. **Vacío:** mensaje de ausencia de momentos. | Momentos carga correctamente y mantiene navegación dentro del módulo. | Baja |
| Tienda | Presentar catálogo básico gestionado por CrunEdu y vías simples de interés/contacto. | Ver productos, abrir detalle, revisar categoría básica, usar botón de contacto/interés. | Abrir detalle de producto, volver al catálogo, aplicar filtros básicos, enviar interés/contacto. | **Carga:** indicadores en catálogo/detalle. **Error:** mensaje de catálogo no disponible. **Vacío:** mensaje de tienda sin productos. | El catálogo básico funciona sin lógica avanzada y sin redirecciones erróneas al feed. | Media |
| Perfil | Mostrar y editar información básica del usuario según permisos y estado de sesión. | Ver perfil propio, editar datos permitidos, guardar cambios, cerrar sesión, ver actividad básica. | Entrar a editar perfil, cancelar cambios, guardar formulario válido/inválido, cambiar pestañas del perfil. | **Carga:** estado de carga de perfil. **Error:** mensajes de validación/guardado claros. **Vacío:** placeholders cuando falte información opcional. | El perfil responde correctamente a acciones del usuario y mantiene sesión/navegación sin saltos inesperados al feed. | Bloqueante |

## Criterio de salida por release

- **Aprobado para merge:** todas las filas bloqueantes en `PASS`.
- **Condicional:** fallas solo medias/bajas con ticket de seguimiento, responsable y fecha objetivo.
- **No aprobado:** cualquier falla bloqueante sin corrección.

## Registro sugerido por ejecución

- Fecha:
- Release/branch:
- Responsable QA:
- Resultado por página (PASS/FAIL):
- Incidencias detectadas:
- Decisión final (Merge / No Merge):
