# Prompt para IA local: finalización y pulido integral de CrunEdu

Alta: 2026-06-18  
Estado: Completed
Responsable sugerido: IA local con acceso a Docker Desktop en Windows 11

## Prompt listo para copiar y pegar

Eres una IA de desarrollo trabajando **en local** sobre el repositorio `C:\GITHUB\crunedu` en Windows 11 con Docker Desktop. Tu objetivo es finalizar y pulir CrunEdu desde el estado actual, sin romper lo que ya funciona, y dejando todo verificado con Docker.

Trabaja como un ingeniero senior full-stack. No improvises una reescritura completa: inspecciona primero, reutiliza patrones existentes y avanza por módulos pequeños, verificables y documentados.

### 1. Contexto del producto

CrunEdu es una red social educativa independiente para estudiantes universitarios, inicialmente enfocada en estudiantes de La Cantuta.

No es una plataforma oficial de la universidad, no es una web oficial universitaria y no debe convertirse en un LMS complejo. El MVP debe ayudar a estudiantes a resolver problemas reales mediante comunidades, publicaciones, preguntas, respuestas, comentarios, guías útiles, trámites estudiantiles, apuntes permitidos, momentos universitarios y una tienda básica administrada por CrunEdu.

Prioriza utilidad real para estudiantes, claridad, estabilidad, simplicidad y mantenimiento.

### 2. Estado confirmado que debes preservar

Antes de tocar código, asume que esto ya funcionaba y no debes romperlo:

- Docker Desktop funciona en local.
- API funciona en `http://localhost:4000/api`.
- Web funciona en `http://localhost:3000`.
- `GET http://localhost:4000/api/health` funciona.
- Prisma migrate y seed funcionaron.
- Existe usuario admin:
  - email: `admin@crunedu.local`
  - password: `CrunEdu123!`
- Registro y login funcionan.
- El login devuelve JWT `accessToken`.
- Comunidades funcionan.
- `GET http://localhost:4000/api/communities` devuelve comunidades reales:
  - Cachimbos
  - Apuntes
  - Trámites
  - General
- `/app/comunidades` consume datos reales de la API.
- `.dockerignore` evita subir `node_modules`, `.next`, `dist` y carpetas similares al contexto Docker.

### 3. Stack y estructura esperada

Monorepo:

- `apps/web`: Next.js + React + TypeScript + Tailwind CSS.
- `apps/api`: NestJS + TypeScript.
- `packages/database`: Prisma + PostgreSQL.
- `packages/shared`: tipos y constantes compartidas.
- `packages/ui`: UI compartida si se usa.

Servicios locales esperados:

- Web: `http://localhost:3000`
- API: `http://localhost:4000/api`
- PostgreSQL: `5432`
- Redis: `6379`
- MinIO API: `9000`
- MinIO Console: `9001`
- Mailhog UI: `8025`
- Mailhog SMTP: `1025`

### 4. Reglas duras

No ejecutes comandos destructivos. Está prohibido:

- `docker compose down -v`
- `docker volume rm`
- `docker system prune -a`
- `rm -rf *`
- `rm -rf node_modules package-lock.json`
- `git reset --hard`
- `git clean -fd`
- `npm audit fix --force`
- `npx prisma migrate reset`
- `npx prisma db push --force-reset`
- `dropdb`
- `truncate`

No borres datos, no resetees la base y no cambies `schema.prisma` salvo que sea estrictamente necesario. Si necesitas tocar Prisma, primero explica por qué, crea una migración normal no destructiva, preserva seed y valida.

No implementes todavía:

- marketplace completo con vendedores externos,
- pagos automáticos,
- carrito avanzado,
- comisiones,
- integración de envíos,
- chat,
- notificaciones reales avanzadas,
- algoritmo de recomendaciones complejo.

### 5. Idioma y estilo

- Código técnico en inglés: variables, funciones, DTOs, servicios, nombres internos.
- UI visible en español: botones, mensajes, labels, empty states y errores.
- Diseño claro antes que decorativo.
- Mobile y desktop deben ser utilizables.
- Mantén Tailwind y los componentes existentes.
- No rediseñes toda la app si un ajuste local resuelve el problema.

### 6. Orden de prioridad del MVP

Trabaja en este orden, verificando cada bloque antes de pasar al siguiente:

1. Auth y sesión de frontend: asegurar registro, login, persistencia de token, logout y estados de error.
2. Comunidades: mantener listado real, detalle, membresía si ya existe y posts por comunidad.
3. Posts / feed: feed real, crear publicación con JWT, conectar usuario y comunidad, estados vacíos y errores claros.
4. Comentarios y Q&A: comentarios básicos en posts y flujo de preguntas/respuestas si ya está parcialmente implementado.
5. Perfil de usuario: perfil propio y público básico, datos seguros, sin exponer hash ni datos sensibles.
6. Guías / trámites / apuntes permitidos: contenido útil gestionado por CrunEdu, sin uploads avanzados si no están listos.
7. Búsqueda básica: resultados simples y seguros.
8. Reportes / moderación: reportar contenido y vistas mínimas de moderación/admin si ya existen.
9. Tienda básica administrada por CrunEdu: productos administrados por CrunEdu, categorías, detalle y botón de interés/contacto. No vendedores externos ni pagos.
10. Pulido transversal: navegación, responsive, accesibilidad básica, estados loading/error/empty y consistencia visual.

### 7. Función prevista de cada sección

#### Landing pública `/`

Debe explicar brevemente qué es CrunEdu, para quién sirve, qué puede hacer un estudiante y cómo entrar. No debe prometer ser una plataforma oficial. CTA principal: registrarse o iniciar sesión. UI en español.

#### Auth

Debe permitir registro, login, persistencia de sesión y logout. El frontend debe manejar errores de credenciales o conexión sin romper la página. El token debe enviarse solo donde corresponda. No expongas datos sensibles.

#### App shell `/app/*`

Debe ser la base de navegación privada o semi-privada de la app. Debe orientar al estudiante hacia feed, comunidades, preguntas, apuntes, debates, momentos, trámites/guías, tienda y perfil. Evita navegación duplicada o confusa.

#### Feed principal `/app`

Es la vida de la red social. Debe mostrar publicaciones reales, permitir crear publicaciones básicas al usuario logueado, elegir comunidad y mostrar autor, comunidad, fecha, título/contenido y conteo de comentarios si existe. Si no hay posts, mostrar empty state claro. No implementes likes/reactions avanzadas salvo que ya existan de forma estable.

#### Comunidades `/app/comunidades`

Son la estructura de CrunEdu. Deben listar comunidades reales desde PostgreSQL, no mocks. Deben ayudar a filtrar el contenido por intereses como Cachimbos, Apuntes, Trámites y General. Si hay detalle o membresía, verifica que funcionen con JWT sin romper la vista pública.

#### Preguntas `/app/preguntas`

Debe funcionar como foro educativo: listado de preguntas, crear pregunta, detalle, responder si ya existe backend, y mostrar estado sin respuestas. Prioriza claridad académica, no gamificación compleja.

#### Debates `/app/debates`

Debe mostrar debates organizados por tendencias o periodos si ya está implementado. La idea es conversación universitaria moderable, no chat en tiempo real. Verifica crear/responder solo si ya existe backend o completa el backend mínimo si está a medio camino.

#### Momentos `/app/momentos`

Debe ser para experiencias universitarias simples. Si hay composer visual, mantenlo simple. No añadas uploads avanzados ni stories complejas. Si usa preview local, debe estar claro que es una interacción básica.

#### Apuntes / documentos permitidos

Debe servir para compartir o encontrar materiales permitidos. Evita fomentar contenido indebido. Si hay carga básica, valida tipo/estado; si no está estable, deja flujo de catálogo/listado y mensajes claros.

#### Guías y trámites

Debe resolver problemas repetidos: matrícula, comedor, carné universitario, constancias, facultades, orientación de cachimbos y documentos permitidos. Puede iniciar como contenido administrado o estático bien organizado si aún no hay backend completo.

#### Búsqueda

Debe buscar de forma básica entre módulos existentes sin prometer ranking inteligente. Debe manejar query vacía, sin resultados y errores.

#### Moderación / reportes

Debe permitir reportar contenido si existe backend. Admin/moderación debe ser mínima y segura. No bloquees usuarios ni borres datos automáticamente sin una regla clara.

#### Tienda básica

Debe ser una tienda administrada por CrunEdu para sostenibilidad: categorías, productos, detalle y botón de interés/contacto. No implementes vendedores externos, pagos, comisiones, carrito avanzado ni envíos.

#### Perfil

Debe mostrar información básica del usuario y su actividad si ya hay endpoints. Perfil propio debe permitir ver datos de sesión. Perfil público no debe exponer email sensible si no corresponde.

### 8. Flujo de trabajo obligatorio

Para cada módulo:

1. Lee `AGENTS.md` completo.
2. Revisa docs relevantes en `docs/*.md`.
3. Revisa scripts en `package.json` antes de ejecutarlos.
4. Inspecciona estructura existente antes de crear archivos nuevos.
5. Reutiliza patrones actuales de NestJS, Next.js, hooks y componentes.
6. Haz cambios pequeños y coherentes.
7. Ejecuta validaciones disponibles.
8. Verifica con Docker local.
9. Documenta qué cambió, qué se verificó y qué queda pendiente.
10. Si creas un nuevo plan `.md`, registra el archivo en `AGENTS.md` con estado, módulo y fecha.

### 9. Comandos de verificación sugeridos en PowerShell

Ejecuta desde Windows PowerShell:

```powershell
cd C:\GITHUB\crunedu
git status
npm ci
npm run db:validate
npm run lint
npm run build
docker compose ps
docker compose up -d --build api web
Start-Sleep -Seconds 10
Invoke-RestMethod http://localhost:4000/api/health
Invoke-RestMethod http://localhost:4000/api/communities
```

Login y prueba de endpoints protegidos:

```powershell
$login = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/auth/login -ContentType "application/json" -Body '{"email":"admin@crunedu.local","password":"CrunEdu123!"}'
$token = $login.accessToken
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri http://localhost:4000/api/posts
Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/posts -Headers $headers -ContentType "application/json" -Body '{"title":"Prueba local CrunEdu","content":"Publicación de verificación desde PowerShell.","communityId":1}'
Invoke-RestMethod -Uri http://localhost:4000/api/posts
```

Si Docker falla, revisa logs sin destruir volúmenes:

```powershell
docker compose logs api --tail=120
docker compose logs web --tail=120
docker compose logs postgres --tail=120
```

Nunca uses `docker compose down -v`.

### 10. Criterios de aceptación antes de finalizar

No des por finalizada la página hasta que se cumpla:

- La app levanta con Docker local.
- Web responde en `http://localhost:3000`.
- API responde en `http://localhost:4000/api/health`.
- Registro/login funcionan.
- Comunidades reales siguen funcionando.
- Feed muestra posts reales y permite crear post con JWT.
- Las páginas principales no muestran errores runtime ni pantallas rotas.
- Todas las rutas principales tienen loading, error y empty states razonables.
- El build pasa o, si no pasa, el motivo está documentado con logs y plan de corrección.
- No hay mocks visibles donde ya existe backend real.
- No se rompió seed ni migraciones.
- No se añadieron dependencias innecesarias.
- No se implementaron features prohibidas fuera del MVP.

### 11. Entregable final que debes dejar

Al terminar, entrega un resumen en español con:

1. Cambios realizados por módulo.
2. Archivos modificados principales.
3. Migraciones aplicadas, si hubo.
4. Comandos ejecutados y resultado.
5. Evidencia Docker: `docker compose ps`, health, communities, posts y captura o descripción de UI.
6. Riesgos restantes.
7. Siguientes pasos recomendados.

Si quedan tareas pendientes, no las ocultes. Déjalas en un `.md` de plan y registra ese `.md` en `AGENTS.md`.

## Resultado de ejecución — 2026-06-18

- Docker reconstruido y servicios principales operativos.
- Build completo, lint, Prisma validate y `quality:gate` ejecutados.
- Auth, registro web, comunidades semilla, feed con título, comentarios, preguntas, apuntes, búsqueda, reportes, perfil y tienda básica revisados.
- QA visual realizada en landing, registro, login, feed, comunidades, preguntas, apuntes, universidad, tienda, perfil y reportes admin.
- No se modificó `schema.prisma` y no se crearon migraciones.
- Riesgos no bloqueantes: no hay productos activos para validar inquiry de tienda; Trámites permanece como contenido administrado/estático; lint conserva advertencias de optimización de imágenes y dependencias de hooks preexistentes.
