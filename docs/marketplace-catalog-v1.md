# Marketplace catálogo v1 (CrunEdu administrado)

## Alcance implementado

- Catálogo administrado por CrunEdu con categorías, productos y bandera de destacado.
- Flujo inicial sin pagos automáticos:
  - detalle de producto
  - botón/contacto vía endpoint de consulta
  - registro en `product_inquiries`
- Conexión con comunidades/carreras (filtro inicial por `communityId` en listado).
- Panel admin básico por API:
  - crear/editar/ocultar producto (`POST /api/marketplace/admin/products`)
  - ver consultas (`GET /api/marketplace/admin/inquiries`)
- Conversión mínima:
  - vistas (`view_count`)
  - clics en contacto (`contact_click_count`)
  - consultas completadas (inquiries con estado `CLOSED`)

## Endpoints

- `GET /api/marketplace/products?communityId=1`
- `GET /api/marketplace/products/:id`
- `POST /api/marketplace/products/:id/inquiries` (JWT)
- `POST /api/marketplace/admin/products` (JWT admin)
- `GET /api/marketplace/admin/inquiries` (JWT)
- `GET /api/marketplace/admin/metrics` (JWT)

## Notas

- No se implementaron pagos automáticos, carrito avanzado ni vendedores externos.
- La pantalla `/app/tienda` ahora consume productos reales desde API.
