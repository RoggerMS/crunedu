# Contrato de API (estado actual MVP)

Base URL local:

```txt
http://localhost:4000/api
```

## Auth

### POST `/auth/login`

Request:

```json
{
  "email": "admin@crunedu.local",
  "password": "CrunEdu123!"
}
```

Response `200`:

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": 1,
    "email": "admin@crunedu.local",
    "role": "ADMIN",
    "isVerified": true,
    "profile": {
      "id": 1,
      "firstName": "Admin",
      "lastName": "CrunEdu"
    }
  }
}
```

## Contrato común de paginación (cursor-based)

Todos los listados paginados usan:

- `cursor`: id numérico del último elemento recibido.
- `limit`: cantidad solicitada (`max` por endpoint).
- `nextCursor`: id para la siguiente página o `null` si no hay más.

Respuesta estándar:

```json
{
  "items": [],
  "nextCursor": 123
}
```

## Posts (feed)

### GET `/posts`

Response `200`:

```json
{
  "items": [
  {
    "id": 7,
    "title": "Post integración",
    "content": "Contenido de prueba para integración",
    "createdAt": "2026-04-29T09:20:00.000Z",
    "author": {
      "id": 5,
      "email": "integration.1714382400000@crunedu.local",
      "firstName": "Inte",
      "lastName": "Gration"
    },
    "community": {
      "id": 1,
      "name": "Cachimbos",
      "slug": "cachimbos"
    },
    "commentsCount": 1
  }
  ],
  "nextCursor": null
}
```

### POST `/posts` (JWT)

Request:

```json
{
  "title": "Post integración",
  "content": "Contenido de prueba para integración",
  "communityId": 1
}
```

Response `201`:

```json
{
  "id": 7,
  "title": "Post integración",
  "content": "Contenido de prueba para integración",
  "createdAt": "2026-04-29T09:20:00.000Z",
  "author": {
    "id": 5,
    "email": "integration.1714382400000@crunedu.local",
    "firstName": "Inte",
    "lastName": "Gration"
  },
  "community": {
    "id": 1,
    "name": "Cachimbos",
    "slug": "cachimbos"
  },
  "commentsCount": 0
}
```

## Comments

### GET `/posts/:id/comments`

Response `200`:

```json
{
  "items": [
  {
    "id": 3,
    "content": "Comentario de integración",
    "createdAt": "2026-04-29T09:21:00.000Z",
    "author": {
      "id": 5,
      "email": "integration.1714382400000@crunedu.local",
      "firstName": "Inte",
      "lastName": "Gration"
    }
  }
]
```

### POST `/posts/:id/comments` (JWT)

Request:

```json
{
  "content": "Comentario de integración"
}
```

Response `201`:

```json
{
  "id": 3,
  "content": "Comentario de integración",
  "createdAt": "2026-04-29T09:21:00.000Z",
  "author": {
    "id": 5,
    "email": "integration.1714382400000@crunedu.local",
    "firstName": "Inte",
    "lastName": "Gration"
  }
}
```

## Questions

### GET `/questions`

Response `200`:

```json
{
  "items": [
  {
    "id": 2,
    "title": "Pregunta integración",
    "content": "¿Cómo validar el módulo de preguntas en integración?",
    "createdAt": "2026-04-29T09:22:00.000Z",
    "isResolved": false,
    "author": {
      "id": 5,
      "email": "integration.1714382400000@crunedu.local",
      "firstName": "Inte",
      "lastName": "Gration"
    },
    "community": {
      "id": 1,
      "name": "Cachimbos",
      "slug": "cachimbos"
    },
    "answersCount": 0,
    "answers": []
  }
  ],
  "nextCursor": null
}
```

### POST `/questions` (JWT)

Request:

```json
{
  "title": "Pregunta integración",
  "content": "¿Cómo validar el módulo de preguntas en integración?",
  "communityId": 1
}
```

Response `201`:

```json
{
  "id": 2,
  "title": "Pregunta integración",
  "content": "¿Cómo validar el módulo de preguntas en integración?",
  "createdAt": "2026-04-29T09:22:00.000Z",
  "isResolved": false,
  "author": {
    "id": 5,
    "email": "integration.1714382400000@crunedu.local",
    "firstName": "Inte",
    "lastName": "Gration"
  },
  "community": {
    "id": 1,
    "name": "Cachimbos",
    "slug": "cachimbos"
  },
  "answersCount": 0,
  "answers": []
}
```

> Nota: Los IDs, timestamps y correo de pruebas cambian por ejecución.

## Communities

### GET `/communities/:id/posts`

Query params:

- `cursor` (opcional)
- `limit` (opcional, máximo 50)

Response `200`:

```json
{
  "items": [],
  "nextCursor": null
}
```

## Marketplace

### GET `/marketplace/products`

Query params:

- `cursor` (opcional)
- `limit` (opcional, máximo 40)
- `categoryId` (opcional)
- `faculty` (opcional)
- `career` (opcional)

Response `200`:

```json
{
  "items": [],
  "featuredProducts": [],
  "nextCursor": null,
  "context": {
    "faculty": "",
    "career": ""
  }
}
```

### GET `/marketplace/admin/inquiries` (JWT)

Query params:

- `cursor` (opcional)
- `limit` (opcional, máximo 50)

Response `200`:

```json
{
  "items": [],
  "nextCursor": null
}
```
