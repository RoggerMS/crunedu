import type { MomentItem, MomentNewsSummary } from "./types";

const now = Date.now();
const h = (n: number) => new Date(now - n * 3600_000).toISOString();
const exp = (n: number) => new Date(now + n * 3600_000).toISOString();
const img = (seed: string) => `https://picsum.photos/seed/${seed}/1200/700`;

export const fallbackMoments: MomentItem[] = [
  ["m1", "Aquí con la mascota roja ❤️", "Está saludando a todos en la puerta principal. ¡Qué buena energía hoy!", "campus", "Puerta principal", ["Campus", "Mascota", "Entrada"], 84, 6, 12],
  ["m2", "Cola en comedor", "Se está llenando rápido antes del mediodía.", "food", "Comedor", ["Comedor", "Aviso"], 99, 20, 16],
  ["m3", "Sistema de matrícula lento", "Varias pantallas con carga infinita.", "alert", "Portal virtual", ["Matrícula", "Sistema"], 122, 32, 21],
  ["m4", "Mochila encontrada", "Está en vigilancia, color azul.", "lost_found", "Pabellón B", ["PerdidoEncontrado"], 40, 12, 9],
  ["m5", "Concierto en el auditorio", "Arranca en 30 minutos.", "event", "Auditorio", ["Cultura", "Evento"], 155, 44, 30],
  ["m6", "Feria en el patio central", "Stands activos y promociones.", "community", "Patio central", ["Campus", "Feria"], 88, 15, 13],
].map((m, i) => ({
  id: m[0] as string, title: m[1] as string, description: m[2] as string, type: m[3] as MomentItem["type"], location: m[4] as string,
  createdAt: h(i + 1), expiresAt: exp(24 - i), tags: m[5] as string[], media: [{ id: `${m[0]}-img`, type: "image", url: img(m[0] as string), alt: m[1] as string }],
  author: { id: `u${i + 1}`, name: "Estudiante CrunEdu" }, stats: { boosts: m[6] as number, confirmations: m[7] as number, comments: m[8] as number, shares: 4 + i, views: 200 + i * 20 },
  viewerState: { boosted: false, passed: false, saved: i % 4 === 0, confirmed: false }, status: "active",
}));

export const fallbackNews: MomentNewsSummary[] = [
  { id: "n1", title: "Cola en Tesorería durante la mañana", summary: "Muchos estudiantes reportan filas largas y atención lenta.", tags: ["Tesorería", "Campus", "Aviso"], status: "active", relatedMomentIds: ["m2"], updatedAt: h(1), stats: { boosts: 142, confirmations: 28, comments: 17, photos: 6 }, coverImageUrl: img("tesoreria") },
  { id: "n2", title: "Cine universitario llenó el auditorio", summary: "Gran asistencia al ciclo de cine esta tarde.", tags: ["Cultura", "Evento", "Campus"], status: "active", relatedMomentIds: ["m5"], updatedAt: h(2), stats: { boosts: 298, confirmations: 65, comments: 31, photos: 12 }, coverImageUrl: img("cine") },
  { id: "n3", title: "Problemas con el sistema de matrícula", summary: "Varios estudiantes reportan errores y lentitud al ingresar.", tags: ["Matrícula", "Aviso", "Sistema"], status: "in_progress", relatedMomentIds: ["m3"], updatedAt: h(3), stats: { boosts: 188, confirmations: 42, comments: 25, photos: 3 }, coverImageUrl: img("matricula") },
];
