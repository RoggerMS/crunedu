# Acceso de desarrollo (solo local/dev)

> ⚠️ **Advertencia de seguridad:** Estas credenciales y flujos son únicamente para entorno local/desarrollo. **Nunca** usar estas cuentas, contraseñas o configuración en producción.

## 1) Usuario admin de desarrollo

- **Email:** `admin@crunedu.local`
- **Password:** `CrunEdu123!`
- **Uso esperado:** pruebas de funcionalidades administrativas del MVP.

## 2) Usuario normal de prueba

Actualmente no hay una credencial fija documentada para usuario normal en este repositorio.

Puedes crear un usuario normal de prueba mediante el endpoint de registro:

- **Endpoint:** `POST http://localhost:4000/api/auth/register`
- **Body de ejemplo:**

```json
{
  "email": "estudiante1@crunedu.local",
  "password": "CrunEdu123!",
  "name": "Estudiante de Prueba"
}
```

## 3) Cómo generar nuevos usuarios de prueba

1. Llamar a `POST /api/auth/register` con un email nuevo.
2. Verificar respuesta exitosa del registro.
3. Iniciar sesión con `POST /api/auth/login` para obtener JWT.
4. Repetir con otros correos para más cuentas de prueba.

Ejemplo rápido en PowerShell (Windows):

```powershell
Invoke-RestMethod -Method Post `
  -Uri http://localhost:4000/api/auth/register `
  -ContentType 'application/json' `
  -Body '{"email":"estudiante2@crunedu.local","password":"CrunEdu123!","name":"Estudiante 2"}'
```

## 4) Permisos por rol

### Admin

- Acceso a capacidades administrativas habilitadas por el backend (según guards/roles del módulo correspondiente).
- Puede usarse para validaciones funcionales del MVP donde se requiera rol elevado.

### Usuario

- Acceso a funcionalidades estándar de estudiante autenticado.
- No debe tener acceso a operaciones restringidas a administradores.

> Nota: los permisos exactos dependen de cada endpoint protegido por JWT y/o control de roles implementado en `apps/api`.

## 5) Endpoints de auth y flujo para obtener JWT

### Endpoints

- **Register:** `POST http://localhost:4000/api/auth/register`
- **Login:** `POST http://localhost:4000/api/auth/login`

### Flujo recomendado

1. Registrar usuario (si no existe) con `POST /auth/register`.
2. Autenticar con `POST /auth/login`.
3. Copiar `accessToken` de la respuesta.
4. Enviar el token en endpoints protegidos con header:

```http
Authorization: Bearer <accessToken>
```

5. Repetir login si el token expira.
