# Sistema de diseño mínimo (MVP)

## Tipografías
- **Base UI:** `Inter, system-ui, sans-serif`.
- **Títulos:** peso `800/900`.
- **Texto general:** peso `400/500`.

## Espaciado
- Escala base: `4px`.
- Espacios recomendados: `8, 12, 16, 20, 24px`.
- Contenedores/card: `p-4` móvil, `p-5` desktop.

## Estados de componentes
- **Loading:** fondo neutro (`slate-50`) + texto claro.
- **Empty:** título + descripción + acción principal.
- **Error:** `red-50/red-700` con mensaje accionable.
- **Success:** `emerald-50/emerald-700` confirmación breve.

## Componentes unificados
- `Card`
- `PrimaryButton`
- `SecondaryButton`
- `Input`, `TextArea`, `Select`
- `StatusMessage`
- `EmptyState`

## Criterios móviles
- Botones con ancho completo cuando sea acción principal.
- Formularios en una sola columna.
- Tarjetas con padding reducido en móvil.
- Listas de feed con separación clara (`space-y-4`).
