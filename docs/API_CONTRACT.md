# Contrato inicial de API

Base URL local:

```txt
http://localhost:4000/api
```

## Health

```txt
GET /health
```

## Auth

```txt
POST /auth/register
POST /auth/login
```

## Módulos scaffolded

Estos endpoints existen como base y deben implementarse por fases:

```txt
GET /users
GET /posts
GET /communities
GET /questions
GET /documents
GET /marketplace
GET /reports
GET /search
```

## Regla de implementación

Cada módulo debe tener:

- DTOs.
- Validaciones.
- Servicios.
- Controladores.
- Reglas de permisos.
- Pruebas básicas.
